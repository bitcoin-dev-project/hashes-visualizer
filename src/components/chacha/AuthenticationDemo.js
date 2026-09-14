import React, { useMemo, useState } from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { authenticationTag, bytesToHex, chacha20, open, seal } from '../../lib/chacha20';

export default function AuthenticationDemo({ secretKey, nonce }) {
  const [tampered, setTampered] = useState(false);
  const demo = useMemo(() => {
    const message = new TextEncoder().encode('Pay Bob $10');
    const aad = new TextEncoder().encode('from=Alice');
    const packet = seal(message, secretKey, nonce, aad);
    const received = packet.ciphertext.slice();
    // A predictable bit flip changes the ASCII '1' into '9', without the key.
    if (tampered) received[9] ^= 8;
    return {
      tag: bytesToHex(packet.tag),
      expected: bytesToHex(authenticationTag(received, secretKey, nonce, aad)),
      raw: new TextDecoder().decode(chacha20(received, secretKey, nonce, 1).output),
      verified: open(received, packet.tag, secretKey, nonce, aad) !== null,
    };
  }, [secretKey, nonce, tampered]);

  return (
    <details className="cc-auth">
      <summary>
        <span className="cc-auth-icon">
          <ShieldCheck size={19} />
        </span>
        <span>
          <strong>And what about Poly1305?</strong>
          <small>Optional next chapter · detecting a changed message</small>
        </span>
        <span className="cc-auth-plus">+</span>
      </summary>
      <div className="cc-auth-body">
        <p>
          <strong>ChaCha20 hides the message. Poly1305 detects tampering.</strong> Together,
          ChaCha20-Poly1305 provides authenticated encryption with associated data (AEAD). First
          understand the cipher above; this adds a check around it.
        </p>
        <div className="cc-auth-flow">
          <div>
            <span>COUNTER 0</span>
            <strong>Make a one-time MAC key</strong>
            <p>First 32 keystream bytes → Poly1305 key. This block never encrypts the message.</p>
          </div>
          <div>
            <span>COUNTER 1, 2, …</span>
            <strong>Encrypt the message</strong>
            <p>ChaCha20 produces the ciphertext using the same secret key and nonce.</p>
          </div>
          <div>
            <span>POLY1305</span>
            <strong>Attach a 16-byte tag</strong>
            <p>
              Authenticate the AAD, ciphertext, padding, and their lengths. Verify before accepting
              plaintext.
            </p>
          </div>
        </div>
        <div className="cc-section-label">Try changing one bit in transit</div>
        <p className="cc-muted">
          This separate example uses your key and nonce, starts encryption at counter 1, and sends
          “Pay Bob $10”. AAD is “from=Alice”: public metadata that is authenticated but not
          encrypted.
        </p>
        <button
          type="button"
          className={`cc-button ${tampered ? '' : 'cc-button-primary'}`}
          aria-pressed={tampered}
          onClick={() => setTampered(!tampered)}
        >
          {tampered ? 'Restore original message' : 'Flip one ciphertext bit ($10 → $90)'}
        </button>
        <div className="cc-auth-comparison" aria-live="polite">
          <div className={tampered ? 'cc-auth-unchecked' : ''}>
            <h3>ChaCha20 alone</h3>
            <strong className="cc-received-text">{demo.raw}</strong>
            <p>
              {tampered
                ? 'The altered message decrypts. There is no built-in check to reject it.'
                : 'The message decrypts, but decryption alone proves no authenticity.'}
            </p>
          </div>
          <div className={demo.verified ? 'cc-auth-pass' : 'cc-auth-fail'}>
            <h3>ChaCha20-Poly1305</h3>
            <strong className="cc-received-text">
              {demo.verified ? (
                <>
                  <ShieldCheck size={18} /> Verified
                </>
              ) : (
                <>
                  <ShieldX size={18} /> Rejected
                </>
              )}
            </strong>
            <p>
              {demo.verified
                ? 'The received tag matches. The receiver can accept “Pay Bob $10”.'
                : 'The tag no longer matches. The receiver releases no plaintext.'}
            </p>
          </div>
        </div>
        <div className="cc-tag-comparison">
          <span>Received tag (unchanged)</span>
          <code>{demo.tag}</code>
          <span>Tag calculated by receiver</span>
          <code className={tampered ? 'cc-danger' : 'cc-success'}>{demo.expected}</code>
        </div>
        <details className="cc-more">
          <summary>A little more about the name and math</summary>
          <p>
            “Poly” refers to polynomial arithmetic. The modulus is 2¹³⁰ − 5, which gives Poly1305
            its name. Its one-time key is split into r and s; r has certain bits cleared
            (“clamping”). For each message chunk with an appended 1 bit, update acc = ((acc + chunk)
            × r) mod (2¹³⁰ − 5). Add s and keep 128 bits to produce the tag.
          </p>
          <p>
            The tag is a keyed message authentication code, not a digital signature. Anyone with the
            shared key can create it. Never reuse a nonce with the same key: that repeats both the
            keystream and the one-time authentication key.
          </p>
        </details>
        <a
          className="cc-source"
          href="https://www.rfc-editor.org/rfc/rfc8439.html#section-2.8"
          target="_blank"
          rel="noreferrer"
        >
          Read the combined construction · RFC 8439 §2.8 ↗
        </a>
      </div>
    </details>
  );
}
