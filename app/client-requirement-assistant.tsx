"use client";

import { useRef, useState } from "react";
import styles from "./client-requirement-assistant.module.css";

type RequirementType = "Plot" | "Villa" | "High-rise" | "Low-rise" | "Other";
type ClientDraft = { name: string; mobile: string; requirement: RequirementType; budget: string; location: string; notes: string };
type SpeechResult = { [index: number]: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: { [index: number]: SpeechResult } };
type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: SpeechEvent) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global { interface Window { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor } }

const initialDraft: ClientDraft = { name: "", mobile: "", requirement: "Villa", budget: "", location: "Gurgaon", notes: "" };
const requirementTypes: RequirementType[] = ["Plot", "Villa", "High-rise", "Low-rise", "Other"];
const whatsappNumber = "919065192063";
const recipientEmail = "bridgeassets97@gmail.com";

function updateFromTranscript(transcript: string, current: ClientDraft): ClientDraft {
  const lower = transcript.toLowerCase();
  const mobileMatch = transcript.match(/(?:\+?91[\s-]?)?(\d[\d\s-]{8,13}\d)/);
  const nameMatch = transcript.match(/(?:my name is|name is|this is)\s+([a-z][a-z\s]{1,40})/i);
  const locationMatch = transcript.match(/(?:in|near|at)\s+([a-z][a-z\s]{2,30})/i);
  const requirement = lower.includes("high rise") || lower.includes("high-rise") ? "High-rise" : lower.includes("low rise") || lower.includes("low-rise") ? "Low-rise" : lower.includes("villa") ? "Villa" : lower.includes("plot") ? "Plot" : current.requirement;
  return { ...current, name: nameMatch ? nameMatch[1].trim().replace(/\s+(and|i)$/i, "") : current.name, mobile: mobileMatch ? mobileMatch[1].replace(/\D/g, "").slice(-10) : current.mobile, requirement, location: lower.includes("gurgaon") || lower.includes("gurugram") ? "Gurgaon" : locationMatch ? locationMatch[1].trim() : current.location, notes: transcript };
}

function detailsMessage(draft: ClientDraft) {
  return ["New Bridge Assets client requirement", `Name: ${draft.name || "Not provided"}`, `Mobile: ${draft.mobile || "Not provided"}`, `Property type: ${draft.requirement}`, `Budget: ${draft.budget || "Not provided"}`, `Preferred location: ${draft.location || "Not provided"}`, `Additional requirements: ${draft.notes || "Not provided"}`].join("\n");
}

export function ClientRequirementAssistant() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ClientDraft>(initialDraft);
  const [listening, setListening] = useState(false);
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const message = detailsMessage(draft);
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  const emailHref = `mailto:${recipientEmail}?subject=${encodeURIComponent("New Bridge Assets client requirement")}&body=${encodeURIComponent(message)}`;
  const updateDraft = (field: keyof ClientDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));

  const enableMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setVoiceStatus("Microphone access is not available in this browser. You can enter the details below."); return; }
    try {
      try {
        const permission = await navigator.permissions?.query({ name: "microphone" as PermissionName });
        if (permission?.state === "denied") { setVoiceStatus("Microphone access is blocked. Select Allow in your browser's site permissions, then try again."); return; }
      } catch { /* Some browsers do not expose microphone permission state. */ }
      const stream = await Promise.race([navigator.mediaDevices.getUserMedia({ audio: true }), new Promise<MediaStream>((_, reject) => setTimeout(() => reject(new Error("permission-timeout")), 10000))]);
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneReady(true);
      setVoiceStatus("Microphone enabled. Press Start voice capture, then speak the client's requirement.");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : error instanceof Error ? error.message : "";
      setMicrophoneReady(false);
      setVoiceStatus(name === "NotAllowedError" ? "Microphone access is blocked. Select Allow in your browser's site permissions, then try again." : name === "permission-timeout" ? "Microphone permission is still waiting. Choose Allow in the browser prompt, then try again." : "We could not access the microphone. Check your browser permissions, then try again.");
    }
  };

  const startVoiceCapture = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setVoiceStatus("Voice input is not available in this browser. You can enter the details below."); return; }
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript.trim();
      setDraft((current) => updateFromTranscript(transcript, current));
      setVoiceStatus("Voice details captured. Please review before sending.");
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") { setMicrophoneReady(false); setVoiceStatus("Microphone access is blocked. Select Allow in your browser's site permissions, then try again."); return; }
      setVoiceStatus(`Voice input could not start (${event.error}). You can enter the details below.`);
    };
    recognition.onend = () => setListening(false);
    setVoiceStatus("Listening for the client's requirement...");
    setListening(true);
    try { recognition.start(); } catch { setListening(false); setVoiceStatus("Voice capture is already active or unavailable. Try again in a moment."); }
  };

  const voiceButtonLabel = listening ? "Listening..." : microphoneReady ? "Start voice capture" : "Enable microphone";
  const closeAssistant = () => { recognitionRef.current?.stop(); setListening(false); setOpen(false); };

  return <><button type="button" className={styles.trigger} onClick={() => setOpen(true)} aria-label="Open client requirement voice assistant" title="Voice assistant"><img src="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/mic-fill.svg" alt="" aria-hidden="true"/></button>{open ? <div className={styles.backdrop} role="presentation"><section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="client-requirement-title"><div className={styles.heading}><div><h2 id="client-requirement-title">Client requirement assistant</h2><p>Capture the details by voice or enter them below, then review before sharing.</p></div><button type="button" className={styles.close} onClick={closeAssistant}>Close</button></div><p className={styles.permissionNote}>Step 1: enable your microphone and choose Allow. Step 2: start voice capture and speak the requirement.</p><button type="button" className={styles.voiceButton} onClick={microphoneReady ? startVoiceCapture : enableMicrophone} disabled={listening}>{voiceButtonLabel}</button>{voiceStatus ? <p className={styles.status} aria-live="polite">{voiceStatus}</p> : null}<div className={styles.fields}><label>Client name<input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Full name"/></label><label>Client mobile number<input type="tel" value={draft.mobile} onChange={(event) => updateDraft("mobile", event.target.value)} placeholder="10-digit mobile number"/></label><label>Property requirement<select value={draft.requirement} onChange={(event) => updateDraft("requirement", event.target.value)}>{requirementTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label>Budget<input value={draft.budget} onChange={(event) => updateDraft("budget", event.target.value)} placeholder="e.g. Rs 1.5 crore"/></label><label>Preferred location<input value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} placeholder="e.g. Gurgaon, Golf Course Road"/></label><label className={styles.full}>Additional requirements<textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Client preferences, timing, size, amenities..." rows={3}/></label></div><div className={styles.actions}><a className={styles.whatsappAction} href={whatsappHref} target="_blank" rel="noreferrer">Send on WhatsApp</a><a className={styles.emailAction} href={emailHref}>Send email</a></div><p className={styles.note}>These actions open a prefilled message for review before sending.</p></section></div> : null}</>;
}
