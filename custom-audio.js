class AudioPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.audioElements = [];
        this.currentPart = 0;
        this.isPlaying = false;
        this.isDrgging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.positionObserver = null;
    }

    connectedCallback() {
        console.log("Connected");
        this.render();
		this.observeAttributeChanges();
        this.setupPositionObserver();
    }

    render() {
        const srcs = this.getAttribute("src").split(",");
        //const src = this.getAttribute("src") || "";
        const label = this.getAttribute("audio-label") || "Play Audio";
        const icon = this.getAttribute("icon") || "✦";
        const bgColor = this.getAttribute("bg-color") || "#f1f3f4";
		const textColor = this.getContrastColor(bgColor);
		const lFactor = textColor=="#232323"? -4 : 8;
		const withControls = this.hasAttribute("controls");
        const isDraggable = this.hasAttribute("draggable");

        
        this.shadowRoot.innerHTML = `
            <style>
                .audio-button__container{
                    position: relative;
                    width: 300px;
					height: 54px;
					display: block;
                    top: 0;
                    left: 0;
                    transition: top 0.3s ease-in-out 0s, left 0.3s ease-in-out 0s;
                }
                .audio-button {
                    --progress: 0;
                    --bg-color: ${bgColor};
                    --bg-color-darker: hsl(from var(--bg-color) calc(h + 5) s calc(l + ${lFactor}) / 1);
					--text-color: ${textColor};
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 20px 0 14px;
                    background: linear-gradient(to right, var(--bg-color-darker) var(--progress), var(--bg-color) var(--progress));
                    background-size: 100% 100%;
                    background-repeat: no-repeat;
                    color: var(--text-color);
                    border-radius: 100px;
                    width: 300px;
                    height: 54px;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    position: absolute;
                    top: 0;
                    left: 0;
                    line-height: 0;
					transition: background 0.2s linear;
                }
				.with-volume .audio-button {
					cursor: pointer;
				}
                .audio-button:hover {
                    background-color: darken(${bgColor}, 10%);
                }
                .left-side{
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    width: fit-content;
					cursor: pointer;
                }
                .audio-icon.grid {
                    margin-right: 0;
                    display: grid;
                    place-items: center;
                }
                .audio-icon svg{
                    height: 24px;
                    width: 24px;
                    display: none;
                }
                .audio-icon svg.active{
                    display: block;
                }
                .audio-duration {
                    display: inline-block;
                    margin-left: auto;
                    font-size: 14px;
                    min-width: 40px;
                    text-align: right;
                }
                audio {
                    display: none;
                }
                    /* Volume Control */
                .volume-container {
                    box-sizing: border-box;
                    position: absolute;
                    bottom: 0;
                    left: 30%;
                    width: 150px;
                    height: fit-content;
                    padding: 15px 5px;
                    transition: opacity 0.3s ease-in-out;
                    opacity: 0;
                    pointer-events: none;
                    transform-origin: left;
                    rotate: -90deg;
                    translate: 0 75px;
                }
                .volume-slider {
                    width: 100%;
                    height: 5px;
                    background: #ddd;
                    border-radius: 10px;
                }
                .right-side{
                    position: relative;
					display: flex;
					align-items: center;
					height: 100%;
					pointer-events: none;
                }
				.with-volume .right-side{
					pointer-events: all;
				}
                .with-volume .right-side:hover .volume-container,
                .with-volume .volume-container:hover{
                    opacity: 1;
                    pointer-events: all;
                }
                input[type="range"] {
                    appearance: none;
                    background: transparent;
                    outline: none;
                    margin: auto 0;
                }
                input[type="range"]::-webkit-slider-runnable-track {
                    height: 5px;
                    background: #000;
                    border-radius: 5px;
                }
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: #3355f5;
                    border-radius: 50%;
                    margin-top: -4px;
                }
                /* Fixed and draggable */
                .floating {
                    position: fixed;
                    top: 50px;
                    left: 50%;
                    /*transform: translateX(-50%);*/
                    /*width: 320px;*/
                    opacity: 0.75;
                    z-index: 1000;                    
                    cursor: grab;
                    transition: none;
                }
                /* Close button */
                .close-btn {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    z-index: 2;
                    background: #fff;
                    color: #232323;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    font-size: 16px;
                    cursor: pointer;
                    display: none;
                }
                .floating .close-btn {
                    display: block;
                }
            </style>
            <div class="audio-button__container${withControls ? " with-volume" : ""}">
                <button class="close-btn">■</button>
                <div class="audio-button">
                    <div class="left-side">
                        <span class="audio-icon grid">
                        <svg class="play active" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                        <path d="M320-200v-560l440 280-440 280Z"/>
                        </svg>
                        <svg class="pause" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z"/>
                        </svg>
                        </span>
                        <span class="audio-label">${label}</span>
                    </div>
                    <div class="right-side">
                        <span class="audio-icon">${icon}</span>
                        ${withControls ? `<div class="volume-container">
                            <input type="range" min="0" max="1" step="0.1" value="1" class="volume-slider">
                        </div>` : ""}
                        <span class="audio-duration">0:00</span>
                    </div>
                </div>
                ${srcs.map(src => `<audio class="player" src="${src}"></audio>`).join("")}
            </div>
        `;
        this.audioElements = this.shadowRoot.querySelectorAll("audio");
        this.durationSpan = this.shadowRoot.querySelector(".audio-duration");
        this.playIcon = this.shadowRoot.querySelector(".play");
        this.pauseIcon = this.shadowRoot.querySelector(".pause");
        this.button = this.shadowRoot.querySelector(".audio-button .left-side");
        this.volumeSlider = this.shadowRoot.querySelector(".volume-slider");
        this.closeBtn = this.shadowRoot.querySelector(".close-btn");
        this.container = this.shadowRoot.querySelector(".audio-button__container");                    
        this.calculateTotalDuration();
        this.addEventListeners();
        this.setupDraggable();
    }

    addEventListeners() {
        this.button.addEventListener("click", () => {
            !this.container.classList.contains("floating") &&
            this.container.classList.add("floating");
            if (this.isPlaying) {
                this.pauseAudio();
            } else {
                this.playAudio();
            }
        });

        this.closeBtn.addEventListener("click", () => {
            this.container.classList.remove("floating");
            this.stopAudio()
        });

        this.audioElements.forEach((audio, index) => {
            audio.addEventListener("ended", () => {
                if (index < this.audioElements.length - 1) {
                    this.currentPart++;
                    this.audioElements[this.currentPart].play();
                } else {
                    this.pauseAudio();
                    this.currentPart = 0; // Reset to first part
                }
            });

            audio.addEventListener("timeupdate", () => {
                this.updateRemainingTime();
                this.updateProgressBar();
            });
        });

		if (this.hasAttribute("controls")) {
			this.volumeSlider.addEventListener("input", (e) => {
				this.audioElements.forEach(audio =>
					audio.volume = e.target.value
				);
			});
		}

    }

    playAudio() {
        this.isPlaying = true;
        this.playIcon.classList.remove("active");
        this.pauseIcon.classList.add("active");
        this.audioElements[this.currentPart].play();
    }

    pauseAudio() {
        this.isPlaying = false;
        this.playIcon.classList.add("active");
        this.pauseIcon.classList.remove("active");
        this.audioElements.forEach(audio => audio.pause());
    }

    stopAudio() {
        this.isPlaying = false;
        this.playIcon.classList.add("active");
        this.pauseIcon.classList.remove("active");
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.container.style.left = "0";
        this.container.style.top = "0";
    }

    calculateTotalDuration() {
        let totalDuration = 0;
        let loaded = 0;

        this.audioElements.forEach(audio => {
            audio.addEventListener("loadedmetadata", () => {
                totalDuration += audio.duration;
                loaded++;

                if (loaded === this.audioElements.length) {
                    this.durationSpan.textContent = this.formatTime(totalDuration);
                }
            });
        });
    }

    updateRemainingTime() {
        let timeLeft = 0;

        for (let i = this.currentPart; i < this.audioElements.length; i++) {
            if (i === this.currentPart) {
                timeLeft += this.audioElements[i].duration - this.audioElements[i].currentTime;
            } else {
                timeLeft += this.audioElements[i].duration;
            }
        }

        this.durationSpan.textContent = this.formatTime(timeLeft);
    }

    updateProgressBar() {
        let currentTime = 0;
        let totalTime = 0;

        for (let i = 0; i < this.audioElements.length; i++) {
            totalTime += this.audioElements[i].duration;
            if (i < this.currentPart) {
                currentTime += this.audioElements[i].duration;
            } else if (i === this.currentPart) {
                currentTime += this.audioElements[i].currentTime;
            }
        }

        const progress = (currentTime / totalTime) * 100;
        this.shadowRoot.querySelector(".audio-button").style.setProperty("--progress", `${progress}%`);
    }

    setupDraggable() {
        let isDragging = false;
        let startX, startY;
    
        const onMouseMove = (event) => {
          if (!isDragging) return;
          this.container.style.left = `${event.clientX - startX}px`;
          this.container.style.top = `${event.clientY - startY}px`;
        };
    
        const onMouseDown = (event) => {
          isDragging = true;
          startX = event.clientX - this.container.getBoundingClientRect().left;
          startY = event.clientY - this.container.getBoundingClientRect().top;
          this.container.style.cursor = "grabbing";
          document.addEventListener("mousemove", onMouseMove);
        };
    
        const onMouseUp = () => {
          isDragging = false;
          this.container.style.cursor = "grab";
          document.removeEventListener("mousemove", onMouseMove);
        };
    
        this.container.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mouseup", onMouseUp);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }
	observeAttributeChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName.startsWith("src")) {
                    this.render();
                }
				if (mutation.attributeName === "bg-color") {
					this.shadowRoot.querySelector(".audio-button").style.setProperty("--bg-color", this.getAttribute("bg-color"));
					this.shadowRoot.querySelector(".audio-button").style.setProperty("--text-color", this.getContrastColor(this.getAttribute("bg-color")));
					const lFactor = this.getContrastColor(this.getAttribute("bg-color"))=="#232323"? -4 : 8;
					this.shadowRoot.querySelector(".audio-button").style.setProperty("--bg-color-darker", `hsl(from var(--bg-color) calc(h + 5) s calc(l + ${lFactor}) / 1)`);
				}
				if (mutation.attributeName === "audio-label") {
					this.shadowRoot.querySelector(".audio-label").textContent = this.getAttribute("audio-label");
				}
            });
        });

        observer.observe(this, { attributes: true });
    }

    setupPositionObserver() {
        const observerOptions = {
          root: null, // Observing relative to viewport
          rootMargin: "-90px 0px 0px 0px", // Trigger when 100px before top
          threshold: 0 // As soon as any part is visible
        };
    
        this.positionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            
          });
        }, observerOptions);
    
        this.positionObserver.observe(this);
      }

	/*color helpers */
	getContrastColor(bgColor) {
		let hexColor = bgColor;
		const textDark = "#232323";
		const textLight = "#fafdf6";
		if (!bgColor) return textDark;
		if (hexColor[0] !== "#" ) return textDark;
		const rgb = this.hexToRgb(hexColor);
		const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
		return brightness > 128 ? textDark : textLight;
	}
	hexToRgb(hex) {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, (m, r, g, b) => {
			return r + r + g + g + b + b;
		});
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
			  }
			: null;
	}
}

customElements.define("audio-player", AudioPlayer);
