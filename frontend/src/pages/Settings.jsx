import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Terminal, CheckCircle2, XCircle, Activity, Server, Cpu, Database, Shield, Sun, Moon } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { checkHealth } from '../services/healthService';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [health, setHealth] = useState('checking');
  const [testing, setTesting] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const testConnection = async () => {
    try {
      setTesting(true);
      setHealth('checking');
      await checkHealth();
      setHealth('online');
    } catch (err) {
      setHealth('offline');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Theme Preference Card */}
      <Card title="Visual Theme Preference" subtitle="Switch between Dark mode and Light mode UI">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Active Appearance: <span className="text-brand-600 dark:text-brand-400 uppercase">{theme} Mode</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Customize the ContainerShield interface for daytime developer work or dark SOC security monitoring.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              Light Mode
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                theme === 'dark'
                  ? 'bg-dark-800 text-white shadow-xs border border-dark-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              Dark Mode
            </button>
          </div>
        </div>
      </Card>

      {/* Backend / API Settings Card */}
      <Card title="Backend & API Configuration" subtitle="Environment settings for ContainerShield Spring Boot connection">
        <div className="space-y-6 font-mono text-xs">
          <div className="p-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase">API Base URL (Environment Variable)</span>
              <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950 dark:text-brand-400 dark:border-brand-800 text-[10px]">
                VITE_API_BASE_URL
              </span>
            </div>
            <p className="text-slate-900 dark:text-slate-100 font-bold text-sm">{apiBaseUrl}</p>
            <p className="text-slate-500 dark:text-slate-500 font-sans text-xs">
              To change this URL, update <code className="text-slate-700 dark:text-slate-300">VITE_API_BASE_URL</code> in your <code className="text-slate-700 dark:text-slate-300">frontend/.env</code> configuration file.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">API Health Status (/health-check)</p>
                <p className="text-[11px] text-slate-500 font-sans">Verifies REST endpoint responsiveness on port 8080</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  health === 'online'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800/50'
                    : health === 'checking'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800/50'
                    : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800/50'
                }`}
              >
                {health === 'online' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Connected
                  </>
                ) : health === 'checking' ? (
                  <>Checking...</>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Disconnected
                  </>
                )}
              </span>

              <Button variant="secondary" size="sm" onClick={testConnection} isLoading={testing}>
                Test Connection
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* System Architecture Tech Stack */}
      <Card title="Platform Architecture & Services" subtitle="Integrated components powering ContainerShield">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold">
              <Server className="w-4 h-4" /> Spring Boot REST Backend
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">Java 17, Spring Data JPA, REST controllers handling Docker CLI & scanner process execution.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
              <Shield className="w-4 h-4" /> Trivy Scanner v0.74.0
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">Container vulnerability analysis engine running as a Docker Compose service.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold">
              <Cpu className="w-4 h-4" /> Semgrep Source Scanner
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">Static code analysis using Java rulesets (p/java) for detecting SQLi and code defects.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-700/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
              <Database className="w-4 h-4" /> PostgreSQL & Ollama AI
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-sans text-xs">PostgreSQL scan history storage & local Ollama (qwen2.5-coder:7b) security LLM.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
