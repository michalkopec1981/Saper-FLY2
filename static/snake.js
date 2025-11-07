class SnakeGame {
    constructor(canvasId, playerId, eventId, currentScore = 0) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.playerId = playerId;
        this.eventId = eventId;

        // Wymiary - dostosowane do ekranu mobilnego
        this.cols = 20;
        this.rows = 20;
        this.calculateCanvasSize();

        // Ustaw początkowy wynik z serwera
        this.score = currentScore;

        // Stan gry
        this.gameOver = false;
        this.gameRunning = false;
        this.moveInterval = 150; // ms - szybkość ruchu węża
        this.lastMove = 0;

        // Wąż
        this.snake = [];
        this.direction = { x: 1, y: 0 }; // Kierunek: prawo
        this.nextDirection = { x: 1, y: 0 }; // Kolejny kierunek (bufor)

        // Jedzenie
        this.food = { x: 0, y: 0 };

        // Kolory
        this.colors = {
            background: '#1a1a2e',
            snake: '#0DFF72',
            snakeHead: '#FFE138',
            food: '#FF0D72',
            grid: '#222'
        };

        this.setupControls();
        this.setupTouchControls();
    }

    calculateCanvasSize() {
        // Oblicz rozmiar canvas bazując na dostępnej przestrzeni
        const availableHeight = window.innerHeight * 0.84 - 4;
        const availableWidth = Math.min(window.innerHeight * 0.84 - 4, window.innerWidth - 142);

        // Oblicz blockSize tak, aby plansza zmieściła się w dostępnej przestrzeni
        const blockSizeByHeight = Math.floor(availableHeight / this.rows);
        const blockSizeByWidth = Math.floor(availableWidth / this.cols);

        this.blockSize = Math.min(blockSizeByHeight, blockSizeByWidth, 40);

        // Ustaw wymiary canvas
        this.canvas.width = this.cols * this.blockSize;
        this.canvas.height = this.rows * this.blockSize;
    }

    setupControls() {
        // Sterowanie klawiaturą (dla komputerów)
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gameOver) return;

            switch(e.key) {
                case 'ArrowLeft':
                    if (this.direction.x === 0) { // Nie pozwól na zawrócenie
                        this.nextDirection = { x: -1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    if (this.direction.x === 0) {
                        this.nextDirection = { x: 1, y: 0 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: -1 };
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    if (this.direction.y === 0) {
                        this.nextDirection = { x: 0, y: 1 };
                    }
                    e.preventDefault();
                    break;
            }
        });
    }

    setupTouchControls() {
        // Przyciski dotykowe dla urządzeń mobilnych
        const leftBtn = document.getElementById('snake-left-btn');
        const rightBtn = document.getElementById('snake-right-btn');
        const upBtn = document.getElementById('snake-up-btn');
        const downBtn = document.getElementById('snake-down-btn');

        if (leftBtn) {
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameRunning && !this.gameOver && this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                }
            });
            leftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameRunning && !this.gameOver && this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                }
            });
        }

        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameRunning && !this.gameOver && this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
            });
            rightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameRunning && !this.gameOver && this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
            });
        }

        if (upBtn) {
            upBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameRunning && !this.gameOver && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                }
            });
            upBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameRunning && !this.gameOver && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                }
            });
        }

        if (downBtn) {
            downBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.gameRunning && !this.gameOver && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                }
            });
            downBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.gameRunning && !this.gameOver && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                }
            });
        }
    }

    start() {
        // Inicjalizacja węża (3 segmenty na środku planszy)
        const startX = Math.floor(this.cols / 2);
        const startY = Math.floor(this.rows / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.gameOver = false;
        this.gameRunning = true;

        this.spawnFood();
        this.updateScore();
        this.gameLoop();
    }

    gameLoop(timestamp = 0) {
        if (!this.gameRunning || this.gameOver) return;

        // Ruch węża co moveInterval ms
        if (timestamp - this.lastMove > this.moveInterval) {
            this.update();
            this.lastMove = timestamp;
        }

        this.draw();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update() {
        // Zaktualizuj kierunek
        this.direction = { ...this.nextDirection };

        // Oblicz nową pozycję głowy
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Sprawdź kolizję ze ścianą
        if (newHead.x < 0 || newHead.x >= this.cols ||
            newHead.y < 0 || newHead.y >= this.rows) {
            this.endGame();
            return;
        }

        // Sprawdź kolizję z własnym ciałem
        for (let segment of this.snake) {
            if (segment.x === newHead.x && segment.y === newHead.y) {
                this.endGame();
                return;
            }
        }

        // Dodaj nową głowę
        this.snake.unshift(newHead);

        // Sprawdź czy wąż zjadł jedzenie
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            this.score++;
            this.updateScore();
            this.spawnFood();

            // Sprawdź czy osiągnięto cel (20 punktów)
            if (this.score >= 20) {
                this.winGame();
                return;
            }

            // Przyspiesz grę po każdych 5 punktach (minimum 80ms)
            if (this.score % 5 === 0 && this.moveInterval > 80) {
                this.moveInterval -= 10;
            }
        } else {
            // Usuń ostatni segment (wąż się nie wydłuża)
            this.snake.pop();
        }
    }

    spawnFood() {
        let validPosition = false;

        while (!validPosition) {
            this.food = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };

            // Sprawdź czy jedzenie nie jest na wężu
            validPosition = true;
            for (let segment of this.snake) {
                if (segment.x === this.food.x && segment.y === this.food.y) {
                    validPosition = false;
                    break;
                }
            }
        }
    }

    draw() {
        // Wyczyść canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Rysuj siatkę
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.blockSize, 0);
            this.ctx.lineTo(i * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.blockSize);
            this.ctx.lineTo(this.canvas.width, i * this.blockSize);
            this.ctx.stroke();
        }

        // Rysuj jedzenie (pulsujące)
        const pulse = Math.sin(Date.now() / 200) * 0.15 + 0.85;
        const foodSize = this.blockSize * pulse;
        const foodOffset = (this.blockSize - foodSize) / 2;

        this.ctx.fillStyle = this.colors.food;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.blockSize + this.blockSize / 2,
            this.food.y * this.blockSize + this.blockSize / 2,
            foodSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Rysuj węża
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const isHead = i === 0;

            // Kolor: głowa żółta, ciało zielone
            this.ctx.fillStyle = isHead ? this.colors.snakeHead : this.colors.snake;
            this.ctx.fillRect(
                segment.x * this.blockSize + 1,
                segment.y * this.blockSize + 1,
                this.blockSize - 2,
                this.blockSize - 2
            );

            // Dodaj efekt 3D
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(
                segment.x * this.blockSize + 1,
                segment.y * this.blockSize + 1,
                this.blockSize - 2,
                3
            );

            // Oczy na głowie
            if (isHead) {
                this.ctx.fillStyle = '#000';
                const eyeSize = this.blockSize / 6;

                if (this.direction.x === 1) { // Prawo
                    this.ctx.fillRect(segment.x * this.blockSize + this.blockSize * 0.6, segment.y * this.blockSize + this.blockSize * 0.3, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.blockSize + this.blockSize * 0.6, segment.y * this.blockSize + this.blockSize * 0.6, eyeSize, eyeSize);
                } else if (this.direction.x === -1) { // Lewo
                    this.ctx.fillRect(segment.x * this.blockSize + this.blockSize * 0.2, segment.y * this.blockSize + this.blockSize * 0.3, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.blockSize + this.blockSize * 0.2, segment.y * this.blockSize + this.blockSize * 0.6, eyeSize, eyeSize);
                } else if (this.direction.y === -1) { // Góra
                    this.ctx.fillRect(segment.x * this.blockSize + this.blockSize * 0.3, segment.y * this.blockSize + this.blockSize * 0.2, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.blockSize + this.blockSize * 0.6, segment.y * this.blockSize + this.blockSize * 0.2, eyeSize, eyeSize);
                } else { // Dół
                    this.ctx.fillRect(segment.x * this.blockSize + this.blockSize * 0.3, segment.y * this.blockSize + this.blockSize * 0.6, eyeSize, eyeSize);
                    this.ctx.fillRect(segment.x * this.blockSize + this.blockSize * 0.6, segment.y * this.blockSize + this.blockSize * 0.6, eyeSize, eyeSize);
                }
            }
        }
    }

    updateScore() {
        const scoreEl = document.getElementById('snake-score');
        if (scoreEl) {
            scoreEl.textContent = this.score;
        }
    }

    async winGame() {
        this.gameRunning = false;
        this.gameOver = true;

        // Wyświetl komunikat
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, this.canvas.height / 2 - 60, this.canvas.width, 120);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WYGRAŁEŚ!', this.canvas.width / 2, this.canvas.height / 2 - 20);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Punkty: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText('Otrzymujesz nagrodę...', this.canvas.width / 2, this.canvas.height / 2 + 40);

        // Wyślij wynik do serwera
        try {
            const response = await fetch('/api/player/minigame/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: this.playerId,
                    game_type: 'snake',
                    score: this.score
                })
            });

            const result = await response.json();

            if (result.success) {
                // Pokaż komunikat o nagrodzie
                setTimeout(() => {
                    alert(result.message);

                    // Zaktualizuj wyświetlane punkty gracza
                    const scoreEl = document.getElementById('player-score');
                    if (scoreEl) {
                        scoreEl.textContent = result.total_score;
                    }

                    // Wróć do głównego widoku
                    document.getElementById('snake-game-view').style.display = 'none';
                    document.getElementById('game-view').style.display = 'block';

                    // Pokaż wiadomość
                    const messageSection = document.getElementById('message-section');
                    if (messageSection) {
                        messageSection.className = 'alert alert-success';
                        messageSection.innerHTML = `
                            <h4>🎉 Gratulacje!</h4>
                            <p>${result.message}</p>
                            <p><strong>Twoje punkty: ${result.total_score}</strong></p>
                        `;
                        messageSection.style.display = 'block';
                    }
                }, 2000);
            } else {
                alert('Błąd: ' + (result.error || 'Nie udało się zapisać wyniku'));
            }
        } catch (error) {
            console.error('Błąd podczas wysyłania wyniku:', error);
            alert('Błąd połączenia z serwerem');
        }
    }

    endGame() {
        this.gameRunning = false;
        this.gameOver = true;

        // Wyświetl komunikat o przegranej
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, this.canvas.height / 2 - 60, this.canvas.width, 120);

        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 10);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '18px Arial';
        this.ctx.fillText(`Punkty: ${this.score}/20`, this.canvas.width / 2, this.canvas.height / 2 + 20);

        // Przywróć przycisk Start
        setTimeout(() => {
            document.getElementById('snake-start-btn').style.display = 'inline-block';
            document.getElementById('snake-start-btn').textContent = 'Spróbuj ponownie';
        }, 1000);
    }
}

// Eksportuj klasę (jeśli używasz modułów)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SnakeGame;
}
