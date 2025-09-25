import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [resultLink, setResultLink] = useState('');

  const generateLink = () => {
    if (!input.trim()) {
      alert('请输入有效的链接！');
      return;
    }
    const encoded = encodeURIComponent(input.trim());
    const fullLink = `${window.location.origin}/api/proxy?url=${encoded}`;
    setResultLink(fullLink);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resultLink);
      alert('链接已复制到剪贴板！');
    } catch (err) {
      alert('复制失败，请手动复制。');
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.title}>链接加速</h1>
        <p>请输入需要加速的链接：</p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如：https://dxfg.netlify.app/"
          style={styles.input}
        />
        <button onClick={generateLink} style={styles.button}>加速</button>

        {resultLink && (
          <div style={styles.result}>
            <span style={styles.link}>{resultLink}</span>
            <button onClick={copyToClipboard} style={styles.copyBtn}>复制链接</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  body: {
    margin: 0,
    fontFamily: 'Segoe UI, Arial, sans-serif',
    background: '#C6E7FF',
    color: '#333',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    overflow: 'hidden',
  },
  container: {
    width: '100%',
    maxWidth: '500px',
    background: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#4A90E2',
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '10px 20px',
    background: '#4A90E2',
    border: 'none',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  result: {
    marginTop: '20px',
    padding: '10px',
    background: '#F9F9F9',
    border: '1px solid #ccc',
    borderRadius: '5px',
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  link: {
    wordWrap: 'break-word',
    wordBreak: 'break-all',
    textAlign: 'center',
    marginBottom: '10px',
    fontSize: '16px',
  },
  copyBtn: {
    padding: '10px 20px',
    background: '#4CAF50',
    border: 'none',
    borderRadius: '5px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
