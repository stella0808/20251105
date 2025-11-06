// ---------------------------------
// p5.js 互動測驗系統
// ---------------------------------

// 系統變數
let gameState = 'LOADING'; // 遊戲狀態: LOADING, START, QUIZ, RESULT, FEEDBACK
let scaleFactor = 1;
const baseWidth = 800;
const baseHeight = 600;

// 題庫變數
let questionTable;
let questions = [];
let currentQuestionIndex = 0;
let score = 0;

// 按鈕與互動
let optionButtons = [];
let startButton;
let restartButton;
let hoverColor;
let clickColor;
let correctColor;
let wrongColor;

// 特效
let particles = []; // 用於回饋動畫
let cursorParticles = []; // 用於滑鼠軌跡

// 計時器
let feedbackTimer = 0; // 答題後顯示回饋的計時器
let feedbackDuration = 120; // 顯示 2 秒 (60 fps * 2)

// ---------------------------------
// 1. p5.js 核心函數 (setup, draw)
// ---------------------------------

function preload() {
    // 預載入 CSV 檔案
    // 'csv' 表示檔案類型, 'header' 表示第一行是標頭
    questionTable = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // 基礎設定
    textFont('Arial', 18);
    textAlign(CENTER, CENTER);
    noCursor(); // 隱藏預設游標

    // 顏色設定
    hoverColor = color(220, 220, 220, 200);
    clickColor = color(100, 200, 255);
    correctColor = color(46, 204, 113, 200);
    wrongColor = color(231, 76, 60, 200);

    // 解析 CSV 資料
    loadAndParseQuestions();

    // 建立按鈕實體
    createButtons();

    // 載入完成，進入開始畫面
    if (questions.length > 0) {
        gameState = 'START';
    } else {
        console.error("題庫載入失敗或為空！");
        gameState = 'ERROR';
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    updateButtonLayout();
}

function draw() {
    background(255);

    // 根據不同的遊戲狀態繪製不同的畫面
    switch (gameState) {
        case 'START':
            drawStartScreen();
            break;
        case 'QUIZ':
            drawQuizScreen();
            break;
        case 'RESULT':
            drawResultScreen();
            break;
        case 'FEEDBACK':
            drawFeedbackAnimation();
            break;
        case 'ERROR':
            drawErrorScreen();
            break;
    }
    
    // 繪製自訂游標和軌跡
    drawCursorTrail();
    drawCustomCursor();
}

// ---------------------------------
// 2. 畫面繪製函數
// ---------------------------------

function drawStartScreen() {
    fill(50);
    textSize(48 * scaleFactor);
    text("歡迎來到 p5.js 測驗", width / 2, height / 2 - 100 * scaleFactor);
    
    textSize(24 * scaleFactor);
    text(`這份測驗共有 ${questions.length} 題`, width / 2, height / 2 - 40 * scaleFactor);

    // 繪製開始按鈕
    startButton.display();
}

function drawQuizScreen() {
    let q = questions[currentQuestionIndex];

    // 繪製問題
    fill(0);
    textSize(28 * scaleFactor);
    text(q.question, width / 2, height / 2 - 150 * scaleFactor);
    
    // 繪製進度
    textSize(16 * scaleFactor);
    fill(100);
    text(`問題 ${currentQuestionIndex + 1} / ${questions.length}`, width / 2, 40);

    // 繪製選項按鈕
    for (let i = 0; i < optionButtons.length; i++) {
        optionButtons[i].setText(q.options[i]); // 更新按鈕文字
        optionButtons[i].display();
    }

    // 處理答題後的回饋
    if (feedbackTimer > 0) {
        feedbackTimer--;
        
        // 根據選擇的答案顯示正確或錯誤的顏色
        for (let btn of optionButtons) {
            if (btn.isCorrect) {
                btn.showColor(correctColor); // 正確答案顯示綠色
            } else if (btn.isSelected) {
                btn.showColor(wrongColor); // 選擇的錯誤答案顯示紅色
            }
        }
        
        // 計時結束後，進入下一題或結算畫面
        if (feedbackTimer === 0) {
            nextQuestion();
        }
    }
}

function drawResultScreen() {
    let percentage = (score / questions.length) * 100;
    
    fill(50);
    textSize(48 * scaleFactor);
    text("測驗結束！", width / 2, height / 2 - 150 * scaleFactor);
    
    textSize(32 * scaleFactor);
    text(`你的分數: ${score} / ${questions.length}`, width / 2, height / 2 - 50 * scaleFactor);
    text(`得分率: ${percentage.toFixed(1)}%`, width / 2, height / 2);

    // 顯示重玩按鈕
    restartButton.display();
}

function drawFeedbackAnimation() {
    // 根據分數決定動畫類型
    let percentage = (score / questions.length) * 100;
    let message = "";
    
    if (percentage >= 80) {
        message = "太棒了！你真是個天才！";
        // 執行稱讚動畫 (煙火/彩帶)
        runPraiseAnimation();
    } else if (percentage >= 50) {
        message = "還不錯！繼續加油！";
        // 執行中等動畫 (泡泡)
        runEncourageAnimation();
    } else {
        message = "別灰心！再試一次吧！";
        // 執行鼓勵動畫 (緩慢上升的粒子)
        runEncourageAnimation();
    }
    
    // 繪製動畫粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
    
    // 顯示訊息
    fill(0, 0, 0, 150); // 帶透明度的黑色
    textSize(36 * scaleFactor);
    text(message, width / 2, height / 2 - 50 * scaleFactor);
    
    textSize(20 * scaleFactor);
    text("點擊畫面任意處重新開始", width / 2, height / 2 + 20 * scaleFactor);
}

function drawErrorScreen() {
    fill(200, 0, 0);
    textSize(24);
    text("錯誤：無法載入 'questions.csv' 檔案。", width / 2, height / 2);
    text("請檢查檔案是否存在且格式正確。", width / 2, height / 2 + 40);
}

// ---------------------------------
// 3. 互動處理 (Mouse)
// ---------------------------------

function mousePressed() {
    // 點擊特效
    for (let i = 0; i < 5; i++) {
        cursorParticles.push(new CursorParticle(mouseX, mouseY, clickColor));
    }

    switch (gameState) {
        case 'START':
            // 檢查是否點擊了開始按鈕
            if (startButton.isHovering(mouseX, mouseY)) {
                gameState = 'QUIZ';
            }
            break;
        case 'QUIZ':
            // 只有在不在回饋時間內才允許點擊
            if (feedbackTimer === 0) {
                // 檢查點擊了哪個選項
                for (let i = 0; i < optionButtons.length; i++) {
                    if (optionButtons[i].isHovering(mouseX, mouseY)) {
                        checkAnswer(i);
                        break; // 點擊後跳出迴圈
                    }
                }
            }
            break;
        case 'RESULT':
            // 檢查是否點擊了重玩按鈕
            if (restartButton.isHovering(mouseX, mouseY)) {
                // 觸發回饋動畫
                gameState = 'FEEDBACK';
                // 重置粒子
                particles = []; 
            }
            break;
        case 'FEEDBACK':
            // 在回饋動畫畫面點擊，則重新開始
            resetQuiz();
            gameState = 'START';
            break;
    }
}

// ---------------------------------
// 4. 測驗邏輯
// ---------------------------------

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function loadAndParseQuestions() {
    // 確保在 setup 階段 questions 陣列不是空的
    if (!questionTable) return;

    // 每次重置測驗時重新解析和隨機排序
    // 這樣每次玩的題目順序和選項順序都會不同
    let allQuestions = [];
    // 1. 從 CSV 讀取所有問題到一個暫存陣列
    for (let r = 0; r < questionTable.getRowCount(); r++) {
        let row = questionTable.getRow(r);
        
        let options = [
            row.getString('option1'),
            row.getString('option2'),
            row.getString('option3'),
            row.getString('option4')
        ];
        
        // CSV 中的 'correct' 是 1-based，所以減 1 得到 0-based 索引
        let correctOptionIndex = parseInt(row.getString('correct')) - 1;
        let correctAnswer = options[correctOptionIndex];

        // 2. 隨機排序選項
        shuffleArray(options);

        // 3. 找到正確答案在亂序後的新索引
        let newCorrectIndex = options.indexOf(correctAnswer);

        allQuestions.push({
            question: row.getString('question'),
            options: options,
            correctIndex: newCorrectIndex
        });
    }
    // 4. 隨機排序所有問題，並選取前 4 題
    shuffleArray(allQuestions);
    questions = allQuestions.slice(0, 4);
}

function createButtons() {
    // 這些按鈕只創建一次，位置和大小在 updateButtonLayout 中更新
    // 開始按鈕
    startButton = new Button(0, 0, 0, 0, "開始測驗");

    // 重玩按鈕 (在結算畫面)
    restartButton = new Button(0, 0, 0, 0, "查看回饋動畫");

    // 選項按鈕
    for (let i = 0; i < 4; i++) {
        optionButtons.push(new Button(0, 0, 0, 0, ""));
    }
    updateButtonLayout();
}

function updateButtonLayout() {
    scaleFactor = min(width / baseWidth, height / baseHeight);

    startButton.update(width / 2 - 100 * scaleFactor, height / 2 + 50 * scaleFactor, 200 * scaleFactor, 60 * scaleFactor);
    restartButton.update(width / 2 - 120 * scaleFactor, height / 2 + 80 * scaleFactor, 240 * scaleFactor, 60 * scaleFactor);

    let btnWidth = 350 * scaleFactor;
    let btnHeight = 60 * scaleFactor;
    let spacing = 20 * scaleFactor;
    let startY = height / 2 - 50 * scaleFactor;

    optionButtons[0].update(width / 2 - btnWidth - spacing / 2, startY, btnWidth, btnHeight);
    optionButtons[1].update(width / 2 + spacing / 2, startY, btnWidth, btnHeight);
    optionButtons[2].update(width / 2 - btnWidth - spacing / 2, startY + btnHeight + spacing, btnWidth, btnHeight);
    optionButtons[3].update(width / 2 + spacing / 2, startY + btnHeight + spacing, btnWidth, btnHeight);
}

function checkAnswer(selectedIndex) {
    let q = questions[currentQuestionIndex];
    
    // 重置所有按鈕狀態
    for (let btn of optionButtons) {
        btn.isSelected = false;
        btn.isCorrect = false;
    }
    
    // 標記被選擇的按鈕
    optionButtons[selectedIndex].isSelected = true;

    // 標記哪個是正確答案
    optionButtons[q.correctIndex].isCorrect = true;

    // 檢查答案是否正確
    if (selectedIndex === q.correctIndex) {
        score++;
        // console.log("Correct!");
    } else {
        // console.log("Wrong!");
    }

    // 啟動回饋計時器
    feedbackTimer = feedbackDuration;
}

function nextQuestion() {
    // 重置按鈕狀態
    for (let btn of optionButtons) {
        btn.isSelected = false;
        btn.isCorrect = false;
    }

    // 移至下一題
    currentQuestionIndex++;

    // 檢查是否所有題目都答完了
    if (currentQuestionIndex >= questions.length) {
        gameState = 'RESULT'; // 進入結算畫面
    }
}

function resetQuiz() {
    score = 0;
    currentQuestionIndex = 0;
    particles = []; // 清空動畫粒子
    loadAndParseQuestions(); // 重新隨機抽題和排序選項
}

// ---------------------------------
// 5. 特效 & 動畫
// ---------------------------------

// --- 游標特效 ---
function drawCustomCursor() {
    push();
    fill(0, 150, 255, 150);
    stroke(255);
    strokeWeight(2);
    // 繪製一個十字星
    line(mouseX - 10, mouseY, mouseX + 10, mouseY);
    line(mouseX, mouseY - 10, mouseX, mouseY + 10);
    pop();
}

function drawCursorTrail() {
    // 繪製軌跡粒子
    for (let i = cursorParticles.length - 1; i >= 0; i--) {
        cursorParticles[i].update();
        cursorParticles[i].display();
        if (cursorParticles[i].isDead()) {
            cursorParticles.splice(i, 1);
        }
    }
    
    // 每隔幾幀新增一個粒子 (如果滑鼠有移動)
    if (frameCount % 3 === 0 && (mouseX !== pmouseX || mouseY !== pmouseY)) {
         cursorParticles.push(new CursorParticle(mouseX, mouseY, color(0, 150, 255, 100)));
    }
}

// --- 測驗回饋動畫 ---
function runPraiseAnimation() {
    // 稱讚 (彩帶/煙火) - 從底部往上噴發
    if (frameCount % 4 === 0) { // 限制粒子生成速率
        for(let i=0; i < 2; i++) {
            particles.push(new FeedbackParticle(random(width), height, 'praise'));
        }
    }
}

function runEncourageAnimation() {
    // 鼓勵 (泡泡) - 從底部緩慢上升
    if (frameCount % 10 === 0) { // 速率更慢
        particles.push(new FeedbackParticle(random(width), height, 'encourage'));
    }
}


// ---------------------------------
// 6. Class 定義 (Button, Particle)
// ---------------------------------

// --- 按鈕 Class ---
class Button {
    constructor(x, y, w, h, txt) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.txt = txt;
        
        this.baseColor = color(255);
        this.strokeColor = color(50);
        
        this.isSelected = false; // 是否被玩家選擇
        this.isCorrect = false;  // 是否為正確答案
    }

    update(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    setText(newTxt) {
        this.txt = newTxt;
    }

    isHovering(px, py) {
        return px > this.x && px < this.x + this.w && py > this.y && py < this.y + this.h;
    }

    // 用於顯示 "正確" 或 "錯誤" 的覆蓋顏色
    showColor(c) {
        push();
        fill(c);
        noStroke();
        rect(this.x, this.y, this.w, this.h, 10); // 圓角
        // 繪製文字
        fill(0);
        textSize(18 * scaleFactor);
        text(this.txt, this.x + this.w / 2, this.y + this.h / 2);
        pop();
    }

    display() {
        push();
        
        // 互動特效：滑鼠懸停
        if (this.isHovering(mouseX, mouseY) && feedbackTimer === 0) { // 只有在可點擊時才顯示懸停
            fill(hoverColor);
            strokeWeight(3);
            stroke(clickColor); // 懸停時高亮邊框
        } else {
            fill(this.baseColor);
            strokeWeight(2);
            stroke(this.strokeColor);
        }
        
        rect(this.x, this.y, this.w, this.h, 10); // 圓角矩形

        // 繪製文字
        fill(50);
        noStroke();
        textSize(18 * scaleFactor);
        text(this.txt, this.x + this.w / 2, this.y + this.h / 2);
        
        pop();
    }
}

// --- 游標粒子 Class ---
class CursorParticle {
    constructor(x, y, c) {
        this.pos = createVector(x, y);
        this.vel = createVector(random(-1, 1), random(-1, 1)); // 輕微擴散
        this.lifespan = 50; // 存活時間
        this.color = c;
        this.size = random(5, 10);
    }
    
    isDead() {
        return this.lifespan <= 0;
    }
    
    update() {
        this.pos.add(this.vel);
        this.lifespan -= 2;
    }
    
    display() {
        push();
        noStroke();
        fill(red(this.color), green(this.color), blue(this.color), this.lifespan * 3); // 漸隱
        ellipse(this.pos.x, this.pos.y, this.size);
        pop();
    }
}

// --- 回饋動畫粒子 Class ---
class FeedbackParticle {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.type = type;
        this.lifespan = 255;
        this.size = random(10, 30);
        
        if (type === 'praise') {
            // 稱讚 (煙火): 往上衝刺，然後受重力影響
            this.vel = createVector(random(-3, 3), random(-10, -5));
            this.acc = createVector(0, 0.2); // 重力
            this.color = color(random(200, 255), random(150, 255), 0, this.lifespan);
        } else {
            // 鼓勵 (泡泡): 緩慢穩定上升
            this.vel = createVector(random(-1, 1), random(-2, -0.5));
            this.acc = createVector(0, 0); // 無重力
            this.color = color(0, 150, 255, this.lifespan);
        }
    }
    
    isDead() {
        return this.lifespan <= 0 || this.pos.y > height + 20; // 掉出畫面也算
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        
        if (this.type === 'praise') {
             this.lifespan -= 2;
        } else {
             this.lifespan -= 1; // 泡泡活久一點
        }
    }

    display() {
        push();
        if (this.type === 'praise') {
            // 彩帶效果
            stroke(red(this.color), green(this.color), blue(this.color), this.lifespan);
            strokeWeight(this.size / 5);
            fill(red(this.color), green(this.color), blue(this.color), this.lifespan / 2);
            ellipse(this.pos.x, this.pos.y, this.size, this.size);
        } else {
            // 泡泡效果
            noFill();
            stroke(red(this.color), green(this.color), blue(this.color), this.lifespan);
            strokeWeight(2);
            ellipse(this.pos.x, this.pos.y, this.size, this.size);
            
            // 泡泡高光
            fill(255, 255, 255, this.lifespan / 2);
            noStroke();
            ellipse(this.pos.x + this.size / 4, this.pos.y - this.size / 4, this.size / 5);
        }
        pop();
    }
}
