package com.example.containershield.service;

import com.example.containershield.dto.TrivyVulnerability;
import com.example.containershield.entity.VulnerabilityFinding;
import com.example.containershield.repository.VulnerabilityFindingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class TrivyService implements ContainerScanner {

    private static final Logger log = LoggerFactory.getLogger(TrivyService.class);

    private final ObjectMapper objectMapper;
    private final VulnerabilityFindingRepository findingRepository;

    @Value("${trivy.server.url:http://containershield-trivy:4954}")
    private String trivyServerUrl;

    public TrivyService(ObjectMapper objectMapper, VulnerabilityFindingRepository findingRepository) {
        this.objectMapper = objectMapper;
        this.findingRepository = findingRepository;
    }

    @Override
    @Transactional
    public List<TrivyVulnerability> scanImage(String imageName) {

        List<TrivyVulnerability> vulnerabilities = new ArrayList<>();

        try {
            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
            
            // Try fast scan using local cached DB and vulnerability scanner only
            ProcessResult result = executeScan(imageName, isWindows, true);

            // If fast scan fails (e.g. initial DB not yet downloaded on host), retry once allowing DB update
            if (result.exitCode() != 0) {
                log.warn("Fast scan with cached DB returned exit code {}. Retrying with database update enabled...", result.exitCode());
                result = executeScan(imageName, isWindows, false);
            }

            // If local trivy CLI is not available or fails on Windows, fallback to Docker container with volumes mounted
            if (result.exitCode() != 0 && isWindows) {
                log.warn("Local Trivy execution failed. Falling back to Docker Trivy container with cached volumes...");
                result = executeDockerFallback(imageName);
            }

            if (result.exitCode() != 0) {
                throw new RuntimeException("Trivy scan failed (exit code " + result.exitCode() + "): " + result.error());
            }

            JsonNode root = objectMapper.readTree(result.output());
            JsonNode results = root.get("Results");

            if (results == null || !results.isArray()) {
                return vulnerabilities;
            }

            LocalDateTime scanTime = LocalDateTime.now();
            List<VulnerabilityFinding> findingsToSave = new ArrayList<>();

            for (JsonNode resNode : results) {
                JsonNode vulnerabilityList = resNode.get("Vulnerabilities");

                if (vulnerabilityList == null || !vulnerabilityList.isArray()) {
                    continue;
                }

                for (JsonNode vulnerability : vulnerabilityList) {
                    String fullDescription = vulnerability.path("Description").asText("");

                    TrivyVulnerability dto = new TrivyVulnerability(
                            vulnerability.path("VulnerabilityID").asText(""),
                            vulnerability.path("PkgName").asText(""),
                            vulnerability.path("InstalledVersion").asText(""),
                            vulnerability.path("FixedVersion").asText(""),
                            vulnerability.path("Severity").asText(""),
                            vulnerability.path("Title").asText(""),
                            fullDescription
                    );

                    vulnerabilities.add(dto);

                    String storedDescription = fullDescription != null && fullDescription.length() > 500
                            ? fullDescription.substring(0, 500) + "..."
                            : fullDescription;

                    findingsToSave.add(new VulnerabilityFinding(
                            null,
                            imageName,
                            scanTime,
                            dto.getVulnerabilityID(),
                            dto.getPackageName(),
                            dto.getInstalledVersion(),
                            dto.getFixedVersion(),
                            dto.getSeverity(),
                            dto.getTitle(),
                            storedDescription
                    ));
                }
            }

            // Batch insert all findings in a single operation
            if (!findingsToSave.isEmpty()) {
                findingRepository.saveAll(findingsToSave);
            }

            return vulnerabilities;

        } catch (Exception e) {
            log.error("Failed to scan Docker image: {}", imageName, e);
            throw new RuntimeException(
                    "Failed to scan Docker image: " + imageName + " (" + e.getMessage() + ")",
                    e
            );
        }
    }

    private ProcessResult executeScan(String imageName, boolean isWindows, boolean skipDbUpdate) throws Exception {
        List<String> command = new ArrayList<>();

        if (isWindows) {
            command.add("trivy");
            command.add("image");
            command.add("--format");
            command.add("json");
            // Only scan package vulnerabilities to avoid expensive regex secret scanning of all layers
            command.add("--scanners");
            command.add("vuln");
            // Suppress network checks
            command.add("--skip-version-check");
            command.add("--skip-java-db-update");
            if (skipDbUpdate) {
                command.add("--skip-db-update");
            }
            command.add(imageName);
        } else {
            command.add("docker");
            command.add("run");
            command.add("--rm");
            command.add("--network");
            command.add("containershield-network");
            command.add("-v");
            command.add("/var/run/docker.sock:/var/run/docker.sock");
            command.add("-v");
            command.add("trivy-cache:/root/.cache/trivy");
            command.add("aquasec/trivy:0.74.0");
            command.add("image");
            command.add("--docker-host");
            command.add("unix:///var/run/docker.sock");
            command.add("--server");
            command.add(trivyServerUrl);
            command.add("--format");
            command.add("json");
            command.add("--scanners");
            command.add("vuln");
            command.add("--skip-version-check");
            command.add("--skip-java-db-update");
            command.add(imageName);
        }

        return runProcess(new ProcessBuilder(command));
    }

    private ProcessResult executeDockerFallback(String imageName) throws Exception {
        List<String> command = new ArrayList<>(List.of(
                "docker", "run", "--rm",
                "-v", "//var/run/docker.sock:/var/run/docker.sock",
                "-v", "trivy-cache:/root/.cache/trivy",
                "aquasec/trivy:0.74.0", "image",
                "--format", "json",
                "--scanners", "vuln",
                "--skip-version-check",
                "--skip-java-db-update",
                imageName
        ));
        return runProcess(new ProcessBuilder(command));
    }

    private ProcessResult runProcess(ProcessBuilder processBuilder) throws Exception {
        Process process = processBuilder.start();

        StringBuilder output = new StringBuilder();
        StringBuilder errorOutput = new StringBuilder();

        try (BufferedReader outputReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
             BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {

            String line;
            while ((line = outputReader.readLine()) != null) {
                output.append(line).append("\n");
            }

            while ((line = errorReader.readLine()) != null) {
                errorOutput.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();
        return new ProcessResult(exitCode, output.toString(), errorOutput.toString());
    }

    private record ProcessResult(int exitCode, String output, String error) {}
}