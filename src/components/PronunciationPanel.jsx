import React, { useState } from 'react';
import './PronunciationPanel.css';

export default function PronunciationPanel({ entry, learnerLang = 'en', baseAudioUrl = '' }) {
    const [speed, setSpeed] = useState(1.0);
    const [isPlaying, setIsPlaying] = useState(false);

    function resolveAudioPath(path) {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('/')) return path;
        return baseAudioUrl ? `${baseAudioUrl.replace(/\/$/, '')}/${path}` : path;
    }

    async function playAudioUrl(url) {
        if (!url) return false;
        try {
            setIsPlaying(true);
            const audio = new Audio(resolveAudioPath(url));
            audio.playbackRate = speed;
            await audio.play();
            audio.onended = () => setIsPlaying(false);
            return true;
        } catch (e) {
            console.warn('audio play failed', e);
            setIsPlaying(false);
            return false;
        }
    }

    async function playCantonese() {
        const variant = entry.cantonese || {};
        const audio = variant.audio || {};
        if (audio.native) {
            const ok = await playAudioUrl(audio.native);
            if (ok) return;
        }
        if (audio.tts_fallback) {
            const ok = await playAudioUrl(audio.tts_fallback);
            if (ok) return;
        }
        if ('speechSynthesis' in window) {
            const text = variant.tts_text || entry.chinese.simplified;
            const ut = new SpeechSynthesisUtterance(text);
            ut.lang = variant.lang_tag || 'yue-HK';
            ut.rate = Math.max(0.5, Math.min(1.5, speed));
            setIsPlaying(true);
            ut.onend = () => setIsPlaying(false);
            const voices = window.speechSynthesis.getVoices();
            const candidate = voices.find(v => v.lang && v.lang.startsWith((ut.lang || '').split('-')[0]));
            if (candidate) ut.voice = candidate;
            window.speechSynthesis.speak(ut);
            return;
        }
        alert('No audio available for Cantonese');
    }

    function playTranslation() {
        const t = (entry.translations && entry.translations[learnerLang]) || null;
        if (!t) {
            alert('No translation available');
            return;
        }
        if ('speechSynthesis' in window) {
            const ut = new SpeechSynthesisUtterance(t.text);
            ut.lang = t.tts_lang || learnerLang;
            ut.rate = Math.max(0.5, Math.min(1.5, speed));
            window.speechSynthesis.speak(ut);
        }
    }

    const learnerFriendly = (entry.learner_friendly && entry.learner_friendly[`for_${learnerLang}`]) || null;
    const translation = (entry.translations && entry.translations[learnerLang]) || null;

    return (
        <div className="pron-panel">
            <div className="pron-header">
                <h2 className="chinese">{entry.chinese ? (entry.chinese.simplified || '') : ''}</h2>
                <div className="definition">{entry.chinese ? entry.chinese.definition : ''}</div>
            </div>
            <div className="pron-grid">
                <div className="field">
                    <label>Jyutping</label>
                    <div className="value">{entry.cantonese ? entry.cantonese.jyutping : ''}</div>
                </div>
                <div className="field">
                    <label>IPA</label>
                    <div className="value">{entry.cantonese ? entry.cantonese.ipa : ''}</div>
                </div>
                <div className="field">
                    <label>Learner-friendly</label>
                    <div className="value">
                        {learnerFriendly ? (learnerFriendly.respelling || learnerFriendly.katakana || '') : '—'}
                        {learnerFriendly && learnerFriendly.hint ? <div className="hint">{learnerFriendly.hint}</div> : null}
                    </div>
                </div>
                <div className="field">
                    <label>Translation ({learnerLang})</label>
                    <div className="value">{translation ? translation.text : '—'}</div>
                </div>
            </div>
            <div className="controls">
                <div className="left-controls">
                    <button onClick={playCantonese} disabled={isPlaying}>▶︎ Play Cantonese</button>
                    <button onClick={playTranslation}>🔊 Play Translation</button>
                </div>
                <div className="right-controls">
                    <label>Speed <input type="range" min="0.6" max="1.4" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} /></label>
                    <span className="speed-value">{speed.toFixed(1)}x</span>
                </div>
            </div>
            <div className="examples">
                <div><strong>Example (zh):</strong> {entry.examples ? entry.examples.zh : ''}</div>
                <div><strong>Example (en):</strong> {entry.examples ? entry.examples.en : ''}</div>
            </div>
        </div>
    );
}