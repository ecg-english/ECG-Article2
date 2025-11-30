class QuizManager {
    constructor(lessonId, questions) {
        this.lessonId = lessonId;
        this.questions = questions;
        this.currentQuestionIndex = 0;
        this.modal = null;
        this.container = null;
        this.userAnswers = []; // ユーザーの回答を保存
        this.correctCount = 0; // 正解数
        
        this.init();
    }

    init() {
        // DOMContentLoadedを待ってから初期化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createModal();
                this.setupEventListeners();
            });
        } else {
            this.createModal();
            this.setupEventListeners();
        }
    }

    createModal() {
        // 既にモーダルが存在する場合は削除
        const existingModal = document.getElementById('quiz-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // モーダルのHTML構造を作成
        const modalHtml = `
            <div id="quiz-modal" class="quiz-modal">
                <div class="quiz-container" id="quiz-container">
                    <!-- ここにスライドが動的に挿入されます -->
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('quiz-modal');
        this.container = document.getElementById('quiz-container');
    }

    setupEventListeners() {
        // 「このレッスンを完了する」ボタンにイベントを設定
        const setupButtons = () => {
            // IDで直接取得を試みる
            const completeBtn = document.getElementById('complete-lesson-btn');
            
            if (completeBtn) {
                // IDで見つかった場合
                if (!completeBtn.dataset.quizListener) {
                    completeBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Complete button clicked!');
                        this.startQuiz();
                    });
                    completeBtn.dataset.quizListener = 'true';
                    console.log('Event listener attached to complete button');
                }
            } else {
                // IDで見つからない場合、テキストで検索
                const allLinks = document.querySelectorAll('a[href="index.html"]');
                
                allLinks.forEach(btn => {
                    const text = btn.textContent.trim();
                    if (text.includes('完了') || text.includes('完了する')) {
                        if (!btn.dataset.quizListener) {
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Complete button clicked (by text)!');
                                this.startQuiz();
                            });
                            btn.dataset.quizListener = 'true';
                        }
                    }
                });
            }
        };

        // DOMContentLoadedを待つ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupButtons);
        } else {
            // 既に読み込み済みの場合
            setTimeout(setupButtons, 100); // 少し遅延させて確実に要素が存在するように
        }
    }

    startQuiz() {
        console.log('Quiz started!');
        this.currentQuestionIndex = 0;
        this.userAnswers = []; // 回答をリセット
        this.correctCount = 0; // 正解数をリセット
        
        // モーダルが存在することを確認
        if (!this.modal || !document.getElementById('quiz-modal')) {
            console.log('Creating modal...');
            this.createModal();
        }
        
        // モーダルとコンテナを再取得（念のため）
        this.modal = document.getElementById('quiz-modal');
        this.container = document.getElementById('quiz-container');
        
        // モーダルを表示
        if (this.modal && this.container) {
            // モーダルを確実に表示
            this.modal.style.display = 'flex';
            this.modal.classList.add('active');
            console.log('Modal activated', this.modal);
            
            // 少し遅延させてから問題を表示（アニメーション用）
            setTimeout(() => {
                this.showQuestion(0);
            }, 100);
        } else {
            console.error('Modal or container not found!', {
                modal: this.modal,
                container: this.container
            });
        }
    }

    showQuestion(index) {
        // コンテナが存在することを確認
        if (!this.container) {
            console.error('Container not found!');
            return;
        }
        
        // コンテナを中央にスクロール
        this.scrollToCenter();
        
        this.container.innerHTML = ''; // クリア
        
        if (index >= this.questions.length) {
            // 全問正解後の解説画面（6枚目）
            this.showResult();
            return;
        }

        const q = this.questions[index];
        const slide = document.createElement('div');
        slide.className = 'quiz-card';
        slide.id = 'current-slide';

        // 問題タイプごとのHTML生成
        let content = `
            <div class="flex justify-between items-center mb-4">
                <span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">Q${index + 1} / 5</span>
                <span class="text-slate-400 text-xs font-bold">QUIZ</span>
            </div>
            <h3 class="text-xl font-bold text-slate-800 mb-6">${q.question}</h3>
        `;

        if (q.type === 'choice' || q.type === 'true_false') {
            content += `<div class="space-y-3">`;
            q.choices.forEach((choice, i) => {
                content += `<button class="quiz-choice-btn" onclick="quizManager.checkAnswer(${i})">${choice}</button>`;
            });
            content += `</div>`;
        } else if (q.type === 'sort') {
            // 並び替え問題
            content += `
                <div class="bg-blue-50 p-4 rounded-lg mb-4 min-h-[3rem] flex flex-wrap gap-2 font-bold text-blue-800" id="sort-answer-area"></div>
                <div class="flex flex-wrap gap-2 mb-6" id="sort-source-area">
                    ${q.words.map((word, i) => {
                        // HTMLエスケープとonclickの安全な処理
                        const safeWord = word.replace(/'/g, "\\'");
                        return `<button class="sortable-word bg-white border border-slate-300 px-4 py-2 rounded-full font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition-all" onclick="quizManager.moveWord(this, '${safeWord}', ${i})">${word}</button>`;
                    }).join('')}
                </div>
                <div class="mt-6 flex justify-end gap-3">
                    <button class="bg-slate-200 text-slate-500 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition" onclick="quizManager.resetSort()">リセット</button>
                    <button class="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition" onclick="quizManager.checkSortAnswer()">決定</button>
                </div>
            `;
        }

        slide.innerHTML = content;
        this.container.appendChild(slide);
        
        // 並び替え問題用の状態管理
        if (q.type === 'sort') {
            this.currentSortAnswer = [];
        }
    }

    // 並び替え問題：単語の移動
    moveWord(btn, word, index) {
        if (btn.classList.contains('used')) return;
        
        const answerArea = document.getElementById('sort-answer-area');
        const wordSpan = document.createElement('span');
        wordSpan.className = 'bg-white px-3 py-1 rounded-full shadow-sm border border-blue-200 cursor-pointer hover:bg-red-50';
        wordSpan.textContent = word;
        wordSpan.dataset.originalIndex = index;
        
        wordSpan.onclick = () => {
            wordSpan.remove();
            btn.classList.remove('used');
            this.currentSortAnswer = this.currentSortAnswer.filter(item => item.index !== index);
        };

        answerArea.appendChild(wordSpan);
        btn.classList.add('used');
        
        this.currentSortAnswer.push({ word, index });
    }

    resetSort() {
        document.getElementById('sort-answer-area').innerHTML = '';
        document.querySelectorAll('.sortable-word').forEach(btn => btn.classList.remove('used'));
        this.currentSortAnswer = [];
    }

    checkSortAnswer() {
        const q = this.questions[this.currentQuestionIndex];
        const currentOrder = this.currentSortAnswer.map(item => item.index);
        const userAnswerText = this.currentSortAnswer.map(item => item.word).join(' ');
        
        // 正解のインデックス順と比較
        let isCorrect = JSON.stringify(currentOrder) === JSON.stringify(q.correctOrder);
        
        // flexibleOrderがある場合、順不同のバリエーションもチェック
        if (!isCorrect && q.flexibleOrder && q.flexibleOrder.length > 0) {
            const validOrders = this.generateFlexibleOrders(q.correctOrder, q.flexibleOrder);
            isCorrect = validOrders.some(order => JSON.stringify(currentOrder) === JSON.stringify(order));
        }
        
        // 回答を保存
        this.userAnswers[this.currentQuestionIndex] = {
            userAnswer: userAnswerText,
            isCorrect: isCorrect,
            question: q
        };
        
        if (isCorrect) {
            this.correctCount++;
            this.animateSuccess();
        } else {
            this.animateFailure();
        }
    }

    // flexibleOrderを考慮して、正解のバリエーションを生成
    generateFlexibleOrders(correctOrder, flexibleOrder) {
        const validOrders = [correctOrder];
        
        // 各flexibleOrderグループについて処理
        for (const group of flexibleOrder) {
            if (group.length < 2) continue;
            
            // correctOrder内で、group内の各インデックスの位置を見つける
            const positions = group.map(originalIndex => {
                return correctOrder.findIndex(orderIndex => orderIndex === originalIndex);
            }).filter(pos => pos !== -1);
            
            if (positions.length < 2) continue;
            
            // 位置を入れ替えたバリエーションを生成
            const newOrders = [];
            for (const order of validOrders) {
                // 2つの位置を入れ替える
                for (let i = 0; i < positions.length; i++) {
                    for (let j = i + 1; j < positions.length; j++) {
                        const newOrder = [...order];
                        const temp = newOrder[positions[i]];
                        newOrder[positions[i]] = newOrder[positions[j]];
                        newOrder[positions[j]] = temp;
                        newOrders.push(newOrder);
                    }
                }
            }
            validOrders.push(...newOrders);
        }
        
        return validOrders;
    }

    checkAnswer(selectedIndex) {
        const q = this.questions[this.currentQuestionIndex];
        
        if (q.type === 'choice' || q.type === 'true_false') {
            const isCorrect = selectedIndex === q.correct;
            const userAnswerText = q.choices[selectedIndex] || '';
            
            // 回答を保存
            this.userAnswers[this.currentQuestionIndex] = {
                userAnswer: userAnswerText,
                isCorrect: isCorrect,
                question: q
            };
            
            if (isCorrect) {
                this.correctCount++;
                this.animateSuccess();
            } else {
                this.animateFailure();
            }
        }
    }

    animateSuccess() {
        const currentSlide = document.getElementById('current-slide');
        if (!currentSlide) return;
        
        // 選択肢ボタンを無効化
        const buttons = currentSlide.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
        
        // コンテナの位置を取得（中央に配置するため）
        const containerRect = this.container.getBoundingClientRect();
        const slideRect = currentSlide.getBoundingClientRect();
        
        // 親コンテナに絶対配置するためのラッパー
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = slideRect.height + 'px';
        wrapper.style.pointerEvents = 'none';
        wrapper.style.zIndex = '10';
        
        const leftPart = currentSlide.cloneNode(true);
        const rightPart = currentSlide.cloneNode(true);
        
        leftPart.className = 'quiz-card shattering-left';
        rightPart.className = 'quiz-card shattering-right';
        
        // ID重複を防ぐ
        leftPart.id = '';
        rightPart.id = '';
        
        // ボタンのイベントを無効化
        leftPart.querySelectorAll('button').forEach(btn => btn.disabled = true);
        rightPart.querySelectorAll('button').forEach(btn => btn.disabled = true);
        
        wrapper.appendChild(leftPart);
        wrapper.appendChild(rightPart);
        
        // 元のスライドを非表示にしてから、ラッパーを追加
        currentSlide.style.opacity = '0';
        currentSlide.style.pointerEvents = 'none';
        this.container.appendChild(wrapper);
        
        // 次の問題へ（スライドを中央にスクロール）
        setTimeout(() => {
            wrapper.remove();
            // コンテナを中央にスクロール
            this.scrollToCenter();
            
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.questions.length) {
                this.showQuestion(this.currentQuestionIndex);
            } else {
                this.showResult();
            }
        }, 600);
    }

    scrollToCenter() {
        // モーダルを上にスクロール（中央に表示されるように）
        if (this.modal) {
            // モーダルのスクロール位置を上にリセット
            this.modal.scrollTop = 0;
            
            // 少し遅延させてから再度中央に配置（アニメーション後に）
            setTimeout(() => {
                if (this.container) {
                    const modalRect = this.modal.getBoundingClientRect();
                    const containerRect = this.container.getBoundingClientRect();
                    const scrollTop = containerRect.top - modalRect.top - (modalRect.height - containerRect.height) / 2;
                    this.modal.scrollTop = Math.max(0, scrollTop);
                }
            }, 50);
        }
    }

    animateFailure() {
        const currentSlide = document.getElementById('current-slide');
        
        // アニメーションクラスをリセットするために一度削除
        currentSlide.classList.remove('blocked');
        void currentSlide.offsetWidth; // リフロー
        currentSlide.classList.add('blocked');
        
        // 0.5秒後にクラスを削除
        setTimeout(() => {
            currentSlide.classList.remove('blocked');
        }, 500);
    }

    showResult() {
        // コンテナを中央にスクロール
        this.scrollToCenter();
        
        // コンテナの幅を広げる（解説スライダー用）
        if (this.container) {
            this.container.classList.add('has-explanation-slider');
        }
        
        // コンテナをクリア
        this.container.innerHTML = '';
        
        const slide = document.createElement('div');
        slide.className = 'quiz-card text-center';
        
        // ローカルストレージにクリア情報を保存
        this.saveProgress();

        // スライダー形式の解説を作成
        const explanationCards = this.questions.map((q, index) => {
            return `
                <div class="explanation-slide">
                    <div class="explanation-header">
                        <span class="question-number">問題 ${index + 1}</span>
                        <span class="result-badge correct">
                            <i class="fa-solid fa-check-circle"></i> 正解
                        </span>
                    </div>
                    <div class="explanation-question">
                        <h4 class="question-text">${q.question}</h4>
                    </div>
                    <div class="explanation-answer">
                        <p class="correct-answer"><strong>正解:</strong> ${this.getCorrectAnswerText(q)}</p>
                    </div>
                    <div class="explanation-content">
                        <div class="explanation-icon">
                            <i class="fa-solid fa-lightbulb"></i>
                        </div>
                        <p class="explanation-text">${q.explanation}</p>
                    </div>
                </div>
            `;
        }).join('');

        slide.innerHTML = `
            <div class="result-header mb-6">
                <i class="fa-solid fa-crown text-6xl text-yellow-400 mb-4 block animate-bounce"></i>
                <h2 class="text-3xl font-bold text-slate-800 mb-2">LESSON CLEARED!</h2>
                <p class="text-slate-500">全問正解おめでとうございます！</p>
            </div>
            
            <div class="explanation-slider-container">
                <div class="explanation-slider-wrapper">
                    <div class="explanation-slider-track" id="explanation-slider-track">
                        ${explanationCards}
                    </div>
                </div>
                <div class="slider-controls">
                    <button class="slider-btn slider-btn-prev" id="slider-prev" onclick="quizManager.prevExplanation()">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <div class="slider-indicators" id="slider-indicators">
                        ${this.questions.map((_, i) => `<span class="indicator ${i === 0 ? 'active' : ''}" onclick="quizManager.goToExplanation(${i})"></span>`).join('')}
                    </div>
                    <button class="slider-btn slider-btn-next" id="slider-next" onclick="quizManager.nextExplanation()">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>

            <button onclick="location.href='index.html'" class="bg-blue-600 text-white font-bold py-3 px-10 rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105 w-full mt-6">
                一覧に戻る
            </button>
        `;
        
        this.container.appendChild(slide);
        
        // スライダーの初期化
        this.currentExplanationIndex = 0;
        this.initExplanationSlider();
        
        // スライドが追加された後、再度中央にスクロール
        setTimeout(() => {
            this.scrollToCenter();
        }, 100);
    }

    getCorrectAnswerText(question) {
        if (question.type === 'choice' || question.type === 'true_false') {
            return question.choices[question.correct];
        } else if (question.type === 'sort') {
            return question.correctOrder.map(i => question.words[i]).join(' ');
        }
        return question.correctAnswer || '';
    }

    initExplanationSlider() {
        const track = document.getElementById('explanation-slider-track');
        const wrapper = track?.parentElement;
        if (!track || !wrapper) return;
        
        // スライダーの幅を設定（各スライドが100%の幅を占める）
        const slideCount = this.questions.length;
        track.style.width = `${slideCount * 100}%`;
        
        // 各スライドの幅を設定（親コンテナの100%、パディングを考慮）
        const slides = track.querySelectorAll('.explanation-slide');
        // clientWidthはパディングを含まない幅を返す
        const wrapperWidth = wrapper.clientWidth;
        slides.forEach((slide, index) => {
            slide.style.width = `${wrapperWidth}px`;
            slide.style.flexShrink = '0';
            slide.style.marginRight = '0';
            slide.style.marginLeft = '0';
        });
        
        // トラックの位置をリセット（左端から正確に）
        track.style.left = '0';
        track.style.marginLeft = '0';
        track.style.paddingLeft = '0';
        track.style.paddingRight = '0';
        
        // 初期位置を設定
        setTimeout(() => {
            this.updateSliderPosition();
        }, 50);
        
        // ウィンドウリサイズ時にスライドの幅を再計算
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const wrapperWidth = wrapper.clientWidth;
                slides.forEach(slide => {
                    slide.style.width = `${wrapperWidth}px`;
                });
                this.updateSliderPosition();
            }, 250);
        });
        
        // タッチスワイプ対応
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        wrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });
        
        wrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            currentX = e.touches[0].clientX;
            const diffX = startX - currentX;
            const slideWidth = wrapper.clientWidth;
            const baseOffset = this.currentExplanationIndex * slideWidth;
            const offset = baseOffset - diffX;
            
            // 移動範囲を制限（最初と最後のスライドを超えないように）
            const minOffset = 0;
            const maxOffset = (this.questions.length - 1) * slideWidth;
            const clampedOffset = Math.max(minOffset, Math.min(maxOffset, offset));
            
            track.style.transform = `translateX(-${clampedOffset}px)`;
            track.style.transition = 'none';
        });
        
        wrapper.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            track.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            const diffX = startX - currentX;
            const threshold = wrapper.clientWidth * 0.2; // 20%以上スワイプで移動
            
            if (Math.abs(diffX) > threshold) {
                if (diffX > 0 && this.currentExplanationIndex < this.questions.length - 1) {
                    this.nextExplanation();
                } else if (diffX < 0 && this.currentExplanationIndex > 0) {
                    this.prevExplanation();
                } else {
                    this.updateSliderPosition();
                }
            } else {
                this.updateSliderPosition();
            }
        });
        
        // マウスドラッグ対応（デスクトップ）
        wrapper.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            isDragging = true;
            wrapper.style.cursor = 'grabbing';
        });
        
        wrapper.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            currentX = e.clientX;
            const diffX = startX - currentX;
            const slideWidth = wrapper.clientWidth;
            const baseOffset = this.currentExplanationIndex * slideWidth;
            const offset = baseOffset - diffX;
            
            // 移動範囲を制限
            const minOffset = 0;
            const maxOffset = (this.questions.length - 1) * slideWidth;
            const clampedOffset = Math.max(minOffset, Math.min(maxOffset, offset));
            
            track.style.transform = `translateX(-${clampedOffset}px)`;
            track.style.transition = 'none';
        });
        
        wrapper.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            wrapper.style.cursor = 'grab';
            track.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            const diffX = startX - currentX;
            const threshold = wrapper.clientWidth * 0.2;
            
            if (Math.abs(diffX) > threshold) {
                if (diffX > 0 && this.currentExplanationIndex < this.questions.length - 1) {
                    this.nextExplanation();
                } else if (diffX < 0 && this.currentExplanationIndex > 0) {
                    this.prevExplanation();
                } else {
                    this.updateSliderPosition();
                }
            } else {
                this.updateSliderPosition();
            }
        });
        
        wrapper.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                wrapper.style.cursor = 'grab';
                track.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                this.updateSliderPosition();
            }
        });
    }

    updateSliderPosition() {
        const track = document.getElementById('explanation-slider-track');
        const wrapper = track?.parentElement;
        if (!track || !wrapper) return;
        
        // 各スライドの幅（ピクセル単位）を取得（clientWidthでパディングを考慮）
        const wrapperWidth = wrapper.clientWidth;
        const slideWidth = wrapperWidth;
        
        // 正確な位置に移動（ピクセル単位、左端から正確に）
        const offset = this.currentExplanationIndex * slideWidth;
        
        // トラックの位置をリセットしてから移動
        track.style.left = '0';
        track.style.marginLeft = '0';
        track.style.paddingLeft = '0';
        track.style.paddingRight = '0';
        track.style.transform = `translateX(-${offset}px)`;
        
        // インジケーターを更新
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            if (index === this.currentExplanationIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
        
        // ボタンの有効/無効を更新
        const prevBtn = document.getElementById('slider-prev');
        const nextBtn = document.getElementById('slider-next');
        if (prevBtn) {
            prevBtn.disabled = this.currentExplanationIndex === 0;
            prevBtn.style.opacity = this.currentExplanationIndex === 0 ? '0.5' : '1';
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentExplanationIndex === this.questions.length - 1;
            nextBtn.style.opacity = this.currentExplanationIndex === this.questions.length - 1 ? '0.5' : '1';
        }
    }

    prevExplanation() {
        if (this.currentExplanationIndex > 0) {
            this.currentExplanationIndex--;
            this.updateSliderPosition();
        }
    }

    nextExplanation() {
        if (this.currentExplanationIndex < this.questions.length - 1) {
            this.currentExplanationIndex++;
            this.updateSliderPosition();
        }
    }

    goToExplanation(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentExplanationIndex = index;
            this.updateSliderPosition();
        }
    }

    saveProgress() {
        // キー: lesson_completed_l{level}-{lesson}
        // 例: lesson_completed_l0-1
        const key = `lesson_completed_${this.lessonId}`;
        localStorage.setItem(key, 'true');
        console.log(`Saved progress: ${key}`);
    }
}

// グローバル変数としてインスタンスを保持（HTML内のonclickからアクセスするため）
let quizManager;

// ページ読み込み時の処理（クリア状況の反映）
document.addEventListener('DOMContentLoaded', () => {
    // 現在のページがレッスン一覧ページ（index.html）の場合
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        applyClearStatus();
    }
});

function applyClearStatus() {
    // 現在のパスからレベルを推定（簡易的）
    // 例: .../level0/index.html -> l0
    const path = window.location.pathname;
    let levelId = '';
    if (path.includes('level0')) levelId = 'l0';
    else if (path.includes('level1')) levelId = 'l1';
    else if (path.includes('level2')) levelId = 'l2';
    else if (path.includes('level3')) levelId = 'l3';
    
    if (!levelId) return;

    const links = document.querySelectorAll('a[href^="lesson-"]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        // href="lesson-l0-1.html" -> l0-1
        const match = href.match(/lesson-(l\d+-\d+)\.html/);
        if (match) {
            const lessonKey = match[1]; // l0-1
            const isCleared = localStorage.getItem(`lesson_completed_${lessonKey}`);
            
            if (isCleared === 'true') {
                link.classList.add('lesson-completed');
                const icon = link.querySelector('.fa-chevron-right');
                if (icon) {
                    icon.classList.replace('fa-chevron-right', 'fa-check');
                    icon.classList.remove('text-slate-300');
                    // スタイルはCSSクラスで制御
                }
            }
        }
    });
}

