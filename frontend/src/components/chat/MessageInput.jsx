import { useRef, useState } from "react";
import { useWebSocket } from "../../context/WebSocketContext";
import { uploadMedia } from "../../api/messages";
import ReplyBar from "./ReplyBar";

export default function MessageInput({ replyTo, onCancelReply, chatId, onMediaSent }) {
  const [text, setText] = useState("");
  const { sendMessage, sendTyping } = useWebSocket();
  const textRef = useRef(null);
  const fileRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const timerRef = useRef(null);

  const sendBtnRef = useRef(null);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    sendMessage(content, replyTo?.id ?? null);
    setText("");
    onCancelReply?.();
    if (textRef.current) { textRef.current.style.height = "auto"; textRef.current.focus(); }
    // bounce animation
    if (sendBtnRef.current) {
      sendBtnRef.current.classList.remove("animate-send");
      void sendBtnRef.current.offsetWidth;
      sendBtnRef.current.classList.add("animate-send");
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") onCancelReply?.();
  };

  const onInput = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    if (e.target.value.trim()) sendTyping();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    e.target.value = "";
    setUploading(true);
    setUploadProgress(0);
    try {
      const { data } = await uploadMedia(chatId, file, replyTo?.id ?? null, setUploadProgress);
      onCancelReply?.();
      onMediaSent?.(data);
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
        if (!chatId) return;
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        setUploading(true);
        try {
          const { data } = await uploadMedia(chatId, file, replyTo?.id ?? null, setUploadProgress);
          onCancelReply?.();
          onMediaSent?.(data);
        } catch (err) {
          alert(err.response?.data?.detail || "Upload failed");
        } finally {
          setUploading(false);
          setRecordTime(0);
        }
      };
      mr.start();
      mediaRecorder.current = mr;
      setRecording(true);
      setRecordTime(0);
      timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    } catch {
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.ondataavailable = null;
      mediaRecorder.current.onstop = null;
      mediaRecorder.current.stop();
      mediaRecorder.current.stream?.getTracks().forEach(t => t.stop());
    }
    clearInterval(timerRef.current);
    setRecording(false);
    setRecordTime(0);
  };

  const formatSecs = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const hasText = text.trim().length > 0;
  // getUserMedia requires HTTPS (or localhost) — hide mic on plain HTTP
  const canRecord = typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    (location.protocol === "https:" || location.hostname === "localhost");

  return (
    <div className="flex-shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ReplyBar replyTo={replyTo} onCancel={onCancelReply} />
      <div className="glass-panel flex items-center gap-2 px-3 py-2.5"
        style={{ borderTop: replyTo ? "none" : "1px solid var(--glass-border)" }}>

        {/* Attach */}
        {!recording && (
          <>
            <button
              onClick={() => !uploading && fileRef.current?.click()}
              disabled={uploading}
              title="Прикрепить файл"
              className="flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90 relative overflow-hidden"
              style={{ background: "var(--bg-elevated)", color: uploading ? "var(--accent-light)" : "var(--text-secondary)" }}
              onMouseEnter={e => { if (!uploading) e.currentTarget.style.color = "var(--accent-light)"; }}
              onMouseLeave={e => { if (!uploading) e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              {/* Circular progress ring */}
              {uploading ? (
                <>
                  <svg className="absolute inset-0 w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(124,111,255,.2)" strokeWidth="2.5"/>
                    <circle cx="18" cy="18" r="15" fill="none"
                      stroke="var(--accent)" strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 15}`}
                      strokeDashoffset={`${2 * Math.PI * 15 * (1 - uploadProgress / 100)}`}
                      style={{ transition: "stroke-dashoffset .2s ease" }}
                    />
                  </svg>
                  <span className="text-xs font-bold relative z-10" style={{ fontSize: 9 }}>
                    {uploadProgress}%
                  </span>
                </>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                </svg>
              )}
            </button>
            <input ref={fileRef} type="file" accept="*/*" className="hidden" onChange={handleFileChange} />
          </>
        )}

        {/* Input area */}
        {recording ? (
          <div className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-2.5"
            style={{ background: "var(--bg-elevated)", border: "1.5px solid rgba(239,68,68,.4)" }}>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>
              {formatSecs(recordTime)}
            </span>
            <button onClick={cancelRecording} className="text-xs font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
              Отмена
            </button>
          </div>
        ) : (
          <div
            className="flex-1 flex items-end rounded-2xl px-3 py-2 transition-all duration-200"
            style={{ background: "var(--bg-elevated)", border: "1.5px solid var(--border)" }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,111,255,.12)"; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <textarea
              ref={textRef}
              className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
              style={{ color: "var(--text-primary)", minHeight: 22, maxHeight: 120 }}
              placeholder="Сообщение…"
              rows={1}
              value={text}
              onInput={onInput}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKey}
            />
          </div>
        )}

        {/* Right button: voice / stop / send */}
        {recording ? (
          <button onClick={stopRecording} title="Send recording"
            className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "var(--accent-gradient)", boxShadow: "0 4px 16px rgba(99,102,241,.5)" }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" style={{ transform: "translateX(1px)" }}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        ) : hasText ? (
          <button ref={sendBtnRef} onClick={send} onMouseDown={e => e.preventDefault()}
            className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-200"
            style={{ background: "var(--accent-gradient)", boxShadow: "0 4px 16px rgba(99,102,241,.5)" }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" style={{ transform: "translateX(1px)" }}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        ) : canRecord ? (
          <button onClick={startRecording} disabled={uploading} title="Голосовое сообщение"
            className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", opacity: uploading ? .4 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-light)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
