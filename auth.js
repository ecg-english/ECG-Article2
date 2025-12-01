// 認証モーダル機能
// ★ここに新しいGASのウェブアプリURLを貼り付けてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbzcftQ57r_aAONU13BUfwgBpfgolCxZHteoZzrLQRU0CIstTCp9UJWJczGrUAX7IccN-A/exec";

// ローカルストレージのキー
const AUTH_KEY = 'ecg_auth_success';

// 認証モーダルのHTMLを生成
function createAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>登録メールアドレスを入力</h2>
            <p>ご利用には登録済みのメールアドレスが必要です。<br>入力後、認証が行われます。</p>
            
            <div class="input-group">
                <input type="email" id="emailInput" placeholder="example@email.com" required>
            </div>
            
            <button id="submitBtn" onclick="checkEmail()">学習を始める</button>
            <div id="errorMsg"></div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 認証モーダルのスタイルを追加
function addAuthModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* モーダルの背景 */
        #authModal {
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: sans-serif;
        }

        /* モーダルの中身 */
        .modal-content {
            background-color: #fff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }

        .modal-content h2 {
            margin-top: 0;
            color: #333;
            font-size: 20px;
        }

        .modal-content p {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
        }

        .input-group {
            margin: 20px 0;
        }

        /* メール入力用にスタイル調整 */
        input[type="email"] {
            width: 100%;
            padding: 12px;
            font-size: 16px;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 4px;
        }

        #authModal button {
            background-color: #28a745;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            font-weight: bold;
            transition: background-color 0.3s;
        }

        #authModal button:hover {
            background-color: #218838;
        }

        #authModal button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }

        #errorMsg {
            color: #d9534f;
            margin-top: 15px;
            font-size: 14px;
            min-height: 20px;
        }
    `;
    document.head.appendChild(style);
}

// メール認証チェック
function checkEmail() {
    const input = document.getElementById('emailInput');
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = document.getElementById('submitBtn');
    const modal = document.getElementById('authModal');
    
    const email = input.value.trim();

    // 簡易的なメール形式チェック
    if (!email || !email.includes('@')) {
        errorMsg.textContent = "正しいメールアドレスを入力してください。";
        return;
    }

    // 送信中表示
    submitBtn.disabled = true;
    submitBtn.textContent = "認証中...";
    errorMsg.textContent = "";

    const formData = new FormData();
    formData.append('email', email);

    fetch(GAS_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 成功時：ローカルストレージに保存
            localStorage.setItem(AUTH_KEY, 'true');
            modal.style.display = "none";
        } else {
            // 失敗時（未登録など）
            errorMsg.textContent = data.message;
            submitBtn.disabled = false;
            submitBtn.textContent = "学習を始める";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        errorMsg.textContent = "通信エラーが発生しました。もう一度お試しください。";
        submitBtn.disabled = false;
        submitBtn.textContent = "学習を始める";
    });
}

// 認証状態をチェック
function checkAuthStatus() {
    const authSuccess = localStorage.getItem(AUTH_KEY);
    
    if (authSuccess === 'true') {
        // 既に認証済みの場合はモーダルを表示しない
        return false;
    }
    
    // 未認証の場合はモーダルを表示
    addAuthModalStyles();
    createAuthModal();
    
    // Enterキー対応
    document.getElementById("emailInput").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("submitBtn").click();
        }
    });
    
    return true;
}

// ページ読み込み時に認証チェック
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});

