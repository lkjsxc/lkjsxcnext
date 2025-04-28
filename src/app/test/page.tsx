// app/websocket-test/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// WebSocketの接続状態を表す型 (より厳密に)
type ConnectionStatus = 'Idle' | 'Connecting' | 'Open' | 'Closing' | 'Closed' | 'Error';

export default function WebSocketTestPage() {
  // 接続先のWebSocket URL
  // 初期値はCloudflare Tunnel経由の想定。
  // ローカルテスト時: 'ws://localhost:3000/api/ping/ws' or 'ws://<DockerホストIP>:3000/api/ping/ws'
  const [wsUrl, setWsUrl] = useState<string>('wss://next.lkjsxc.com/api/ping/ws');

  // WebSocketインスタンス (Refで管理し、再レンダリングの影響を受けないようにする)
  const webSocketRef = useRef<WebSocket | null>(null);

  // 接続状態
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Idle');

  // 受信メッセージ (新しいものが上に来るように管理)
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

  // エラーメッセージ
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 送信するメッセージ
  const [messageToSend, setMessageToSend] = useState<string>('');

  // WebSocketへの接続処理
  const handleConnect = useCallback(() => {
    // 既に接続中、接続済み、切断中の場合は処理しない
    if (webSocketRef.current && webSocketRef.current.readyState < WebSocket.CLOSING) {
      console.warn('WebSocket is already connected or connecting.');
      return;
    }

    console.log(`Attempting to connect to: ${wsUrl}`);
    setConnectionStatus('Connecting');
    setReceivedMessages([]); // メッセージ履歴をクリア
    setErrorMessage(null);   // エラーメッセージをクリア

    try {
      // WebSocketインスタンスを作成
      // 注意: new WebSocket() 自体の同期的なエラー (例: 不正なURL) はここでキャッチできるが、
      // 接続試行中の非同期エラー (例: サーバーが見つからない) は onerror または onclose でハンドルされる。
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws; // Refにインスタンスを保存

      // --- WebSocketイベントハンドラの設定 ---

      ws.onopen = () => {
        console.log('WebSocket connected successfully.');
        setConnectionStatus('Open');
        setErrorMessage(null); // 接続成功したらエラーメッセージをクリア
      };

      ws.onmessage = (event: MessageEvent) => {
        // event.data が Blob や ArrayBuffer の場合もあるため、適切に処理する
        let messageData: string;
        if (typeof event.data === 'string') {
          messageData = event.data;
        } else if (event.data instanceof Blob) {
          // Blobの場合、テキストとして読み込む例 (非同期になるので注意)
          // ここでは単純にtoString()で代替するか、必要ならFileReaderを使う
          messageData = '[Received Blob Data]'; // 仮表示
          // event.data.text().then(text => {
          //   console.log('WebSocket message received (Blob Text):', text);
          //   setReceivedMessages((prev) => [text, ...prev]);
          // }).catch(err => console.error("Error reading blob:", err));
          // return; // 非同期処理する場合はここで抜ける
        } else {
          messageData = event.data.toString();
        }

        console.log('WebSocket message received:', messageData);
        // 最新メッセージをリストの先頭に追加
        setReceivedMessages((prevMessages) => [messageData, ...prevMessages]);
      };

      ws.onclose = (event: CloseEvent) => {
        console.log(`WebSocket disconnected. Code: ${event.code}, Reason: '${event.reason}', WasClean: ${event.wasClean}`);
        console.log('CloseEvent object:', event);

        // 接続が正常に確立される前に閉じられた場合 (Error状態の方が適切)
        if (connectionStatus === 'Connecting' && !event.wasClean) {
             setConnectionStatus('Error');
             // コード1006はブラウザ/環境起因の異常切断で、Reasonは空が多い
             const reasonText = event.reason || (event.code === 1006 ? 'Abnormal closure' : 'N/A');
             setErrorMessage(`Connection failed: Code=${event.code}, Reason='${reasonText}' (Closed before established)`);
        } else {
            // 意図しない切断(エラー)か、正常な切断かを判断
            const finalStatus = event.wasClean ? 'Closed' : 'Error';
            setConnectionStatus(finalStatus);

            // エラー状態でない場合のみ、切断理由を表示（エラーイベントが先にエラーメッセージを設定している場合があるため）
            if (finalStatus === 'Closed' || !errorMessage) {
                 const reasonText = event.reason || (event.code === 1006 ? 'Abnormal closure' : 'N/A');
                 setErrorMessage(`Disconnected: Code=${event.code}, Reason='${reasonText}'`);
            }
        }
        webSocketRef.current = null; // 接続終了したのでRefをクリア
      };

      ws.onerror = (event) => {
        // onerror イベントは通常、具体的なエラー情報をあまり提供しない。
        // 代わりに、接続が失敗した場合は onclose イベントもトリガーされることが多い。
        console.error('WebSocket error event:', event);
        // エラーメッセージを設定するが、oncloseでより詳細な情報が得られる場合がある
        setErrorMessage('WebSocket error occurred. Check console and close event details for more info.');
        setConnectionStatus('Error');
        // webSocketRef.current = null; // 通常 onclose も呼ばれるのでそちらでクリア
      };

    } catch (error) {
      // new WebSocket() 自体の同期的なエラー (例: 不正なURL形式)
      console.error('Failed to create WebSocket instance (synchronous error):', error);
      setConnectionStatus('Error');
      setErrorMessage(`Failed to initialize WebSocket: ${error instanceof Error ? error.message : String(error)}`);
      webSocketRef.current = null;
    }
  }, [wsUrl, connectionStatus, errorMessage]); // errorMessageも追加 (onclose内で既存エラーメッセージを参照するため)

  // WebSocket切断処理
  const handleDisconnect = useCallback(() => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      console.log('Disconnecting WebSocket manually...');
      setConnectionStatus('Closing');
      // 正常な切断 (コード 1000) を試みる
      webSocketRef.current.close(1000, 'User disconnected manually');
    } else {
      console.warn('WebSocket is not connected or already closing/closed.');
    }
  }, []); // 依存なし

  // メッセージ送信処理
  const handleSendMessage = useCallback(() => {
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      if (messageToSend.trim() === '') {
          console.warn('Attempted to send an empty message.');
          setErrorMessage('Cannot send an empty message.'); // ユーザーにフィードバック
          return;
      }
      console.log('Sending message:', messageToSend);
      try {
        webSocketRef.current.send(messageToSend);
        setMessageToSend(''); // 送信成功したら入力欄をクリア
        setErrorMessage(null); // 送信成功したらエラーメッセージをクリア
      } catch (error) {
        console.error('Failed to send message:', error);
        setErrorMessage(`Send failed: ${error instanceof Error ? error.message : String(error)}`);
        // 送信失敗した場合、接続が切れている可能性もあるため、状態を確認・更新する処理を追加してもよい
        // 例: if (webSocketRef.current?.readyState !== WebSocket.OPEN) setConnectionStatus('Error');
      }
    } else {
      console.warn('WebSocket is not open. Cannot send message.');
      setErrorMessage('Cannot send message: WebSocket is not connected or ready.');
    }
  }, [messageToSend]); // messageToSend に依存

  // コンポーネントアンマウント時のクリーンアップ処理
  useEffect(() => {
    // この effect はマウント時に一度だけ実行される (依存配列が空のため)

    // クリーンアップ関数: コンポーネントがアンマウントされるときに実行される
    return () => {
      // アンマウント時に WebSocket 接続が存在し、まだ開いているか接続中なら閉じる
      // readyState が CLOSING や CLOSED の場合は何もしない
      // 注意: クリーンアップ関数は effect が実行された時点の ref.current をキャプチャするのではなく、
      // クリーンアップ関数が *実行される* 時点の ref.current を参照する。
      const ws = webSocketRef.current;
      if (ws && ws.readyState < WebSocket.CLOSING) {
        console.log('Component unmounting: Closing WebSocket connection.');
        // コード 1001 (Going Away) は、エンドポイントが利用できなくなることを示す
        ws.close(1001, 'Component unmounted');
      }
      // Note: webSocketRef.current をここで null にする必要はない。
      // なぜなら、コンポーネントがアンマウントされるため、この ref はもはや参照されない。
      // 再マウントされた場合は、新しい ref と新しい接続が handleConnect で作成される。
    };
  }, []); // 空の依存配列: マウント時とアンマウント時にのみ実行

  // --- スタイル定義 (変更なし) ---
  const styles = {
    container: { padding: '20px', fontFamily: 'sans-serif' },
    inputGroup: { marginBottom: '10px' },
    label: { marginRight: '5px', display: 'inline-block', minWidth: '110px' }, // ラベル幅調整
    input: { marginRight: '10px', padding: '5px' },
    button: { marginRight: '10px', padding: '5px 10px', cursor: 'pointer' },
    status: { marginTop: '15px', fontWeight: 'bold' },
    error: { color: 'red', marginTop: '5px', wordBreak: 'break-all' }, // エラーメッセージも改行対応
    messages: { marginTop: '15px', border: '1px solid #ccc', padding: '10px', height: '300px', overflowY: 'scroll', backgroundColor: '#f9f9f9', listStyle: 'none' }, // ul のデフォルトスタイルをリセット
    messageItem: { marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px dashed #eee', wordBreak: 'break-all' }, // 長いメッセージで改行
  };

  // --- レンダリング ---
  return (
    <div style={styles.container}>
      <h1>WebSocket Connection Test</h1>

      {/* URL入力 */}
      <div style={styles.inputGroup}>
        <label htmlFor="ws-url" style={styles.label}>WebSocket URL:</label>
        <input
          type="text"
          id="ws-url"
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          style={{ ...styles.input, width: '400px' }}
          // 接続処理中や接続中はURLを変更できないようにする
          disabled={connectionStatus === 'Connecting' || connectionStatus === 'Open' || connectionStatus === 'Closing'}
        />
      </div>

      {/* 接続/切断ボタン */}
      <div style={styles.inputGroup}>
        <button
          onClick={handleConnect}
          // 接続処理中や接続中は接続ボタンを無効化
          disabled={connectionStatus === 'Connecting' || connectionStatus === 'Open' || connectionStatus === 'Closing'}
          style={styles.button}
        >
          Connect
        </button>
        <button
          onClick={handleDisconnect}
          // 接続中('Open')以外は切断ボタンを無効化
          disabled={connectionStatus !== 'Open'}
          style={styles.button}
        >
          Disconnect
        </button>
      </div>

      {/* ステータス表示 */}
      <div style={styles.status}>
        Status: <span style={{ color: connectionStatus === 'Open' ? 'green' : connectionStatus === 'Error' ? 'red' : connectionStatus === 'Closed' || connectionStatus === 'Closing' ? 'gray' : 'black' }}>
          {connectionStatus}
        </span>
      </div>

      {/* エラーメッセージ表示 */}
      {errorMessage && (
        <div style={styles.error}>
          Error: {errorMessage}
        </div>
      )}

      {/* メッセージ送信フォーム */}
      <div style={styles.inputGroup}>
        <label htmlFor="message-input" style={styles.label}>Send Message:</label>
        <input
          type="text"
          id="message-input"
          value={messageToSend}
          onChange={(e) => setMessageToSend(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && connectionStatus === 'Open') handleSendMessage(); }} // Enterキーで送信
          style={styles.input}
          // 接続中('Open')以外は送信フォームを無効化
          disabled={connectionStatus !== 'Open'}
        />
        <button
          onClick={handleSendMessage}
          // 接続中('Open')以外は送信ボタンを無効化
          disabled={connectionStatus !== 'Open'}
          style={styles.button}
        >
          Send
        </button>
      </div>

      {/* 受信メッセージ表示エリア */}
      <div style={styles.messages}>
        <h2>Received Messages (Newest First):</h2>
        {receivedMessages.length === 0 ? (
          <p>No messages received yet.</p>
        ) : (
          <ul>
            {receivedMessages.map((msg, index) => (
              // より安定したキーが必要な場合は、メッセージにIDやタイムスタンプを含めることを検討
              <li key={index} style={styles.messageItem}>{msg}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}