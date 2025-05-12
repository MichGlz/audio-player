class AudioPlayer extends HTMLElement {

    static get observedAttributes() {
        return ["class", "audio-label", "src", "bg-color"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.audioElements = [];
        this.currentPart = 0;
        this.isActive = false;
        this.isPlaying = false;
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.positionObserver = null;
        this.label='';
        this.scrs='';
        this.bgColor='';
        this.textColor='';
        this.lFactor=0;
        this.hasControls=false;
        this.isDraggable = false;
        this.totalDuration = 0;
        this.currentTime = 0;
        this.lastUpdateTime = 0;
        this.updateScheduled = false;
        this.isProgressDragging = false;


        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    connectedCallback() {
        this.render();
		this.observeAttributeChanges();
        this.setupPositionObserver();
    }

    attributeChangedCallback(name, oldValue, newValue) {
    }

    render() {
        const srcs = this.getAttribute("src").split(",");
        const label = this.getAttribute("audio-label") || "Play Audio";
        const icon = this.getAttribute("icon") || "✦";
        const bgColor = this.getAttribute("bg-color") || "#f1f3f4";
		const textColor = this.getContrastColor(bgColor);
		const lFactor = textColor=="#232323"? -4 : 8;
		const withControls = this.hasAttribute("controls");
        this.isDraggable = this.hasAttribute("draggable");

        this.shadowRoot.innerHTML = `
            <style>
			:host {
				display: block;
				position: relative;
				width: 100%;
				height: 100%;
				min-width: 300px;
				max-width: 500px;
				min-height: 54px;
				max-height: 54px;
				background: transparent;
				border-radius: 100px;
				overflow: hidden;
				cursor: default;
				font-family: Arial, sans-serif;
				font-size: 14px;
				color: #232323;
				font-weight: 400;
				line-height: 1.5;
				box-sizing: border-box;
				-webkit-transition: background 0.3s ease-in-out;
				transition: background 0.3s ease-in-out;
				-webkit-user-select: none;
				-moz-user-select: none;
				-ms-user-select: none;
				user-select: none;
				-webkit-touch-callout: none;
				touch-action: none;
				pointer-events: all;
			}

			:host([hidden]) {
				display: none;
			}

			.audio-button__container {
				position: relative;
				width: 100%;
				min-width: 300px;
				max-width: 500px;
				height: 54px;
				display: block;
				top: 0;
				left: 0;
				opacity: 1;
				-webkit-transition: opacity 0.3s ease-in-out;
				transition: opacity 0.3s ease-in-out;
			}

			.audio-button {
				--progress: 0;
				--bg-color: ${bgColor};
				--bg-color-darker: hsl(from var(--bg-color) calc(h + 5) s calc(l + ${lFactor}) / 1);
				--text-color: ${textColor};
				--blue: #3355f5;
				--gray: #c7c8c9;
				--dark-gray: #636464;
				box-sizing: border-box;
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
				-webkit-box-align: center;
				-ms-flex-align: center;
				align-items: center;
				-webkit-box-pack: justify;
				-ms-flex-pack: justify;
				justify-content: space-between;
				gap: 1rem;
				padding: 0 20px 0 14px;
				background: -webkit-linear-gradient(left, var(--bg-color-darker) var(--progress), var(--bg-color) var(--progress));
				background: linear-gradient(to right, var(--bg-color-darker) var(--progress), var(--bg-color) var(--progress));
				background-size: 100% 100%;
				background-repeat: no-repeat;
				color: var(--text-color);
				border-radius: 100px;
				width: 100%;
				height: 54px;
				font-family: Arial, sans-serif;
				font-size: 14px;
				position: absolute;
				top: 0;
				left: 0;
				line-height: 0;
				-webkit-transition: background 0.2s linear, padding 0.3s linear;
				transition: background 0.2s linear, padding 0.3s linear;
			}

			.with-volume .audio-button {
				cursor: pointer;
			}

			.audio-button:hover {
				background-color: darken(${bgColor}, 10%);
			}

			.left-side {
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
				-webkit-box-align: center;
				-ms-flex-align: center;
				align-items: center;
				gap: 10px;
				width: -webkit-fit-content;
				width: -moz-fit-content;
				width: fit-content;
				cursor: pointer;
			}

			.audio-icon.grid {
				margin-right: 0;
				display: -ms-grid;
				display: grid;
				place-items: center;
			}

			.audio-icon svg {
				height: 24px;
				width: 24px;
				display: none;
			}

			.audio-icon svg.active {
				display: block;
			}

			.audio-duration {
				display: -webkit-inline-box;
				display: -ms-inline-flexbox;
				display: inline-flex;
				margin-left: auto;
				font-size: 14px;
				width: 100%;
				height: 100%;
				-webkit-box-pack: center;
				-ms-flex-pack: center;
				justify-content: center;
				-webkit-box-align: center;
				-ms-flex-align: center;
				align-items: center;
				max-width: -webkit-fit-content;
				max-width: -moz-fit-content;
				max-width: fit-content;
				text-align: right;
				opacity: 1;
				-webkit-transition: width 0.3s linear;
				transition: width 0.3s linear;
				overflow: hidden;
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
				height: -webkit-fit-content;
				height: -moz-fit-content;
				height: fit-content;
				padding: 15px 5px;
				-webkit-transition: opacity 0.3s ease-in-out;
				transition: opacity 0.3s ease-in-out;
				opacity: 0;
				pointer-events: none;
				-webkit-transform-origin: left;
				transform-origin: left;
				-webkit-transform: translate(0, 75px) rotate(-90deg);
				transform: translate(0, 75px) rotate(-90deg);
			}

			.volume-slider {
				--progress: 100%;
				width: 100%;
				height: 5px;
				background: #ddd;
				border-radius: 10px;
				opacity: 0;
				pointer-events: none;
			}

			.speaker.active:hover .volume-slider {
				opacity: 1;
				pointer-events: all;
			}

			.right-side {
				position: relative;
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
				-webkit-box-align: center;
				-ms-flex-align: center;
				align-items: center;
				height: 100%;
				pointer-events: none;
			}

			.with-volume .right-side {
				pointer-events: all;
			}

			.with-volume .right-side:hover .volume-container,
			.with-volume .volume-container:hover {
				opacity: 1;
				pointer-events: all;
			}

			input[type="range"] {
				-webkit-appearance: none;
				-moz-appearance: none;
				appearance: none;
				background: var(--blue);
				outline: none;
				margin: auto 0;
			}

			input[type="range"]::-webkit-slider-runnable-track {
				 width: 100%;
				height: 5px;
				background: linear-gradient(to right, var(--blue) var(--progress), var(--gray) var(--progress));
				border-radius: 5px;
				cursor: pointer;
			}

			input[type="range"].volume-slider::-webkit-slider-runnable-track {
				background: linear-gradient(to right, var(--text-color) var(--progress), var(--gray) var(--progress));
			}

			input[type="range"]::-webkit-slider-thumb {
				-webkit-appearance: none;
				appearance: none;
				width: 12px;
				height: 12px;
				border-radius: 50%;
				background: var(--blue);
				margin-top: -4px;
				opacity: 0;
				pointer-events: none;
			}

			input[type="range"].volume-slider::-webkit-slider-thumb {
				background: var(--text-color);
			}

			input[type="range"]:hover::-webkit-slider-thumb {
				opacity: 1;
				pointer-events: all;
			}

			input[type="range"]::-moz-range-track {
				width: 100%;
				height: 5px;
				background: var(--gray);
				border-radius: 5px;
				cursor: pointer;
			}

			input[type="range"]::-moz-range-progress {
				background: var(--blue);
				border-radius: 5px;
				height: 5px;
				cursor: pointer;
			}

			input[type="range"].volume-slider::-moz-range-progress {
				background: var(--text-color);
			}

			input[type="range"]::-moz-range-thumb {
				width: 12px;
				height: 12px;
				border-radius: 50%;
				background: var(--blue);
				border: none;
				cursor: pointer;
				opacity: 0;
				pointer-events: none;
			}

			input[type="range"].volume-slider::-moz-range-thumb {
				background: var(--text-color);
			}

			input[type="range"]:hover::-moz-range-thumb {
				opacity: 1;
				pointer-events: all;
			}

			input[type="range"]::-ms-track {
				width: 100%;
				height: 5px;
				background: transparent;
				border-color: transparent;
				color: transparent;
				cursor: pointer;
			}

			input[type="range"]::-ms-fill-lower {
				background: var(--blue);
				border-radius: 5px;
			}

			input[type="range"].volume-slider::-ms-fill-lower {
				background: var(--text-color);
			}

			input[type="range"]::-ms-fill-upper {
				background: var(--gray);
				border-radius: 5px;
			}

			input[type="range"]::-ms-thumb {
				width: 12px;
				height: 12px;
				border-radius: 50%;
				background: var(--blue);
				margin-top: -4px;
				opacity: 0;
				pointer-events: none;
			}

			input[type="range"].volume-slider::-ms-thumb {
				background: var(--text-color);
			}

			input[type="range"]:hover::-ms-thumb {
				opacity: 1;
				pointer-events: all;
			}

			/* Fixed and draggable */
			.floating {
				position: fixed;
				opacity: 0.75;
				z-index: 1000;
				-webkit-transition: opacity 0.2s linear;
				transition: opacity 0.2s linear;
			}

			.banish {
				opacity: 0;
				pointer-events: none;
			}

			/* Close button */
			.close-btn {
				--text-color: #232323;
				position: absolute;
				top: -10px;
				right: -8px;
				z-index: 2;
				background: #fff;
				color: var(--text-color);
				border: 1px solid var(--text-color);
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

			.icon-draggable {
				width: 0;
				overflow: hidden;
				-webkit-transition: width 0.3s ease-in-out;
				transition: width 0.3s ease-in-out;
			}

			.floating .icon-draggable {
				width: 24px;
				cursor: -webkit-grab;
				cursor: grab;
			}

			.banish .icon-draggable {
				width: 0;
			}

			.floating .audio-button {
				padding: 0 6px 0 14px;
			}

			.banish .audio-button {
				padding: 0 20px 0 14px;
			}

			.audio-label, .audio-duration-label {
				display: none;
			}

			.audio-label.active {
				display: inline-block;
				width: -webkit-fit-content;
				width: -moz-fit-content;
				width: fit-content;
			}

			.audio-duration-label.active {
				display: inline-block;
			}

			.audio-progress {
				position: relative;
				top: 0;
				left: 0;
				-webkit-box-flex: 1;
				-ms-flex-positive: 1;
				flex-grow: 1;
				height: 4px;
				background: -webkit-linear-gradient(left, var(--blue) var(--progress), var(--gray) var(--progress));
				background: linear-gradient(to right, var(--blue) var(--progress), var(--gray) var(--progress));
				background-size: 100% 100%;
				background-repeat: no-repeat;
				z-index: 1;
				pointer-events: none;
				-webkit-transition: background 0.2s linear;
				transition: background 0.2s linear;
				border-radius: 100px;
			}

			.speaker, .volume-speed {
				display: none;
			}

			.speaker.active {
				display: -webkit-inline-box;
				display: -ms-inline-flexbox;
				display: inline-flex;
				width: 24px;
				height: 24px;
				cursor: pointer;
			}

			.star-icon {
				display: -webkit-inline-box;
				display: -ms-inline-flexbox;
				display: inline-flex;
				width: 24px;
				color: var(--gray);
			}

			/* Fallback for :has() selector in Safari */
			.right-side:has(.speaker.active) .audio-duration,
			.volume-speed.active ~ .audio-duration {
				display: none;
			}

			.right-side:has(.speaker.active) .volume-speed {
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
			}

			.right-side:has(.speaker.active) .star-icon,
			.volume-speed.active ~ .star-icon {
				color: var(--blue);
			}

			.audio-progress-container {
				position: relative;
				-webkit-box-flex: 1;
				-ms-flex-positive: 1;
				flex-grow: 1;
				height: 4px;
				background: var(--gray);
				border-radius: 100px;
				opacity: 0;
				pointer-events: none;
				-webkit-transition: opacity 0.3s ease-in-out;
				transition: opacity 0.3s ease-in-out;
				width: 0;
			}

			.audio-progress-container.active {
				opacity: 1;
				pointer-events: all;
			}

			.audio-progress-bar {
				--progress: 0;
				width: 100%;
				height: 100%;
				background: var(--blue);
				-webkit-transform-origin: left;
				transform-origin: left;
				-webkit-transform: scaleX(var(--progress));
				transform: scaleX(var(--progress));
				-webkit-transition: -webkit-transform 1s linear;
				transition: transform 1s linear;
				border-radius: 100px;
			}

			.element__wrapper {
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
				-webkit-box-align: center;
				-ms-flex-align: center;
				align-items: center;
				-webkit-box-pack: center;
				-ms-flex-pack: center;
				justify-content: center;
				min-width: 24px;
				min-height: 24px;
			}

			.volume-speed {
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
				-webkit-box-align: center;
				-ms-flex-align: center;
				align-items: center;
				-webkit-box-pack: center;
				-ms-flex-pack: center;
				justify-content: center;
				width: 100%;
				max-width: -webkit-fit-content;
				max-width: -moz-fit-content;
				max-width: fit-content;
				opacity: 1;
				overflow: hidden;
				-webkit-transition: width 0.3s linear;
				transition: width 0.3s linear;
				pointer-events: all;
			}

			.volume-speed.colapse {
				width: 0;
				pointer-events: none;
			}

			.volume-slider__wrapper {
				position: absolute;
				top: 50%;
				right: 100%;
				width: 0;
				height: 36px;
				border-radius: 100px 0 0 100px;
				background: var(--dark-gray);
				-webkit-transform: translate(0, -50%);
				transform: translate(0, -50%);
				pointer-events: none;
			}

			.speaker {
				pointer-events: all;
				cursor: pointer;
			}

			.speaker.active:hover {
				background: var(--dark-gray);
				height: 36px;
				border-radius: 0 100px 100px 0;
			}

			.speaker.active:hover .volume-slider__wrapper {
				width: 100px;
				opacity: 1;
				pointer-events: all;
				display: -webkit-box;
				display: -ms-flexbox;
				display: flex;
				box-sizing: border-box;
				padding-inline: 10px;
			}

			.speed-control__wrapper{
				width:fit-content;
				position: relative;
			}
			.speed-control__wrapper:hover {
				color: var(--blue);
			}
			.speed-control{
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				opacity: 0;
				cursor: pointer;
				background: transparent;
				pointer-events: all;
			}
			.speed-display{
				pointer-events: none;
			}
		</style>
            <div class="audio-button__container${withControls ? " with-volume" : ""}">
                <button class="close-btn">■</button>
                <div class="audio-button">
                    <div role="button" class="left-side">
                        <span class="audio-icon grid">
                        <svg class="play active" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -1100 1100 1100" width="24px" fill="currentColor">
                        <path d="M350-300v-560l440 280-440 280Z"/>
                        </svg>
                        <svg class="pause" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -1100 1100 1100" width="24px" fill="currentColor">
                            <path d="M580-300v-560h160v560H560Zm-320 0v-560h160v560H240Z"/>
                        </svg>
                        </span>
                        <span class="audio-label active">${label}</span>
                        <span class="audio-duration-label">0:00 / 0:00</span>
                    </div>
                    <input type="range" class="audio-progress-container progress-range" min="0" />
                    <div class="right-side">
                        <div class='volume-speed colapse'>
                            <div class="element__wrapper speaker" height="24" width="24">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zm2.5 0c0 3.04-1.64 5.64-4.5 7.07v-2.13c1.76-.77 3-2.53 3-4.94s-1.24-4.17-3-4.94V4.93c2.86 1.43 4.5 4.03 4.5 7.07z"/>
                                </svg>
                                <div class="volume-slider__wrapper">
                                    <input type="range" min="0" max="1" step="0.1" value="1" class="volume-slider">
                                </div>
                            </div>
                            <div class="element__wrapper speed-control__wrapper" height="24" width="24">
                                <label class="speed-display" for="speed-select">1x</label>
                                <select class="speed-control">
                                    <option value="0.75">0.75x</option>
                                    <option value="1" selected>1x</option>
                                    <option value="1.25">1.25x</option>
                                    <option value="1.5">1.5x</option>
                                    <option value="1.75">1.75x</option>
                                    <option value="2">2x</option>
                                </select>
                            </div>
                        </div>
                        <div class="element__wrapper audio-icon star-icon">${icon}</div>
                        <p class="audio-duration">0:00</p>
                        ${this.isDraggable ? `<div class="icon-draggable draggable-area">
                             <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z"/></svg>
                        </div>` : ""}
                    </div>
                </div>
                ${srcs.map(src => `<audio class="player" src="${src}"></audio>`).join("")}
            </div>
        `;

        this.audioElements = this.shadowRoot.querySelectorAll("audio");
        this.durationSpan = this.shadowRoot.querySelector(".audio-duration");
        this.audioLabel = this.shadowRoot.querySelector(".audio-label");
        this.durationLabel = this.shadowRoot.querySelector(".audio-duration-label");
        this.playIcon = this.shadowRoot.querySelector(".play");
        this.pauseIcon = this.shadowRoot.querySelector(".pause");
        this.button = this.shadowRoot.querySelector(".audio-button .left-side");
        this.volumeSlider = this.shadowRoot.querySelector(".volume-slider");
        this.closeBtn = this.shadowRoot.querySelector(".close-btn");
        this.container = this.shadowRoot.querySelector(".audio-button__container");
        this.speaker = this.shadowRoot.querySelector(".speaker");
        this.volumeSpeed = this.shadowRoot.querySelector(".volume-speed");
        this.audioProgressContainer = this.shadowRoot.querySelector(".audio-progress-container");
        this.audioProgressBar = this.shadowRoot.querySelector('input[type="range"].progress-range');
        this.calculateTotalDuration(false, this.audioProgressBar);
        this.addEventListeners();
    }

    addEventListeners() {
        this.button.addEventListener("click", () => {
            if (!this.isActive) {
                this.isActive = true;
                this.durationLabel.classList.add("active");
                this.audioLabel.classList.remove("active");
                this.speaker.classList.add("active");
                this.audioProgressContainer.classList.add("active");
                this.volumeSpeed.classList.remove("colapse");
				this.volumeSpeed.classList.add("active");
            }
            if(!this.container.classList.contains("floating") && this.isDraggable){
                const top = this.container.getBoundingClientRect().top;
                const left = this.container.getBoundingClientRect().left;
                this.container.style.top = `${top}px`;
                this.container.style.left = `${left}px`;
                this.container.classList.add("floating");
                this.setupDraggable();
            }
            if (this.isPlaying) {
                this.pauseAudio();
            } else {
                this.playAudio();
            }
        });

        this.closeBtn.addEventListener("click", () => {
            const banish = () => {
                this.container.classList.remove("floating");
                this.container.classList.remove("banish");
                this.stopAudio();
                this.container.removeEventListener("transitionend", banish);
            }
            this.container.addEventListener("transitionend", banish);
            this.container.classList.add("banish");
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
                const now = Date.now();
            if (now - this.lastUpdateTime >= 500) { // Update every 1 second
                this.updateRemainingTime();
                this.updateProgressBar();
                this.lastUpdateTime = now;
            }

            });
        });

        this.volumeSlider.addEventListener("input", (e) => {
            this.audioElements.forEach(audio =>
                audio.volume = e.target.value
            );
            const progress = e.target.value * 100; // Convert to percentage
            this.volumeSlider.style.setProperty("--progress", `${progress}%`);
        });

         // Add event listeners for progress bar drag
        this.audioProgressBar.addEventListener("mousedown", () => {
            this.isProgressDragging = true; // Mark that the user is dragging
            this.pauseAudio(); // Pause audio while dragging
        });

        this.audioProgressBar.addEventListener("input", (e) => {
            if (this.isProgressDragging) {
                const newTime = parseFloat(e.target.value);
                this.seekToTime(newTime); // Update the seek position
            }
        });

        this.audioProgressBar.addEventListener("mouseup", () => {
            if (this.isProgressDragging) {
                this.isProgressDragging = false;
                this.playAudio();
            }
        });

        const speedControl = this.shadowRoot.querySelector(".speed-control");
        const speedDisplay = this.shadowRoot.querySelector(".speed-display");
        speedControl.addEventListener("change", (e) => {
            const speed = parseFloat(e.target.value);
            speedDisplay.textContent = `${speed}x`; // Update the display text
            this.audioElements.forEach(audio => {
                audio.playbackRate = speed; // Update playback speed for all audio elements
            });
        });
    }

    seekToTime(newTime) {
        let accumulatedTime = 0;

        for (let i = 0; i < this.audioElements.length; i++) {
            const audio = this.audioElements[i];
            const audioDuration = audio.duration;

            if (newTime < accumulatedTime + audioDuration) {
                // Found the correct audio file
                const timeInCurrentAudio = newTime - accumulatedTime;

                // Pause all audio files
                this.audioElements.forEach(a => a.pause());

                // Set the current part and update the current audio's time
                this.currentPart = i;
                audio.currentTime = timeInCurrentAudio;

                // Play the current audio if the player is active
                if (this.isPlaying) {
                    setTimeout(() => {
                        audio.play().catch(error => {
                            console.error("Error playing audio:", error);
                        });
                    }, 0);
                }
                break;
            }

            accumulatedTime += audioDuration;
        }

        this.updateProgressBar();
        this.updateRemainingTime();
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
        this.isActive = false;
        this.playIcon.classList.add("active");
        this.pauseIcon.classList.remove("active");
        this.audioLabel.classList.add("active");
        this.durationLabel.classList.remove("active");
        this.speaker.classList.remove("active");
        this.audioProgressContainer.classList.remove("active");
        this.volumeSpeed.classList.add("colapse");
		this.volumeSpeed.classList.remove("active");
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.container.style.left = "0";
        this.container.style.top = "0";
        this.container.classList.remove("floating");
        const stop = true;
        this.currentPart = 0;
        this.setupDraggable(stop);
        this.updateProgressBar();
    }

    calculateTotalDuration(returnValue = false) {
        let totalDuration = 0;
        let loaded = 0;

        this.audioElements.forEach(audio => {
            audio.addEventListener("loadedmetadata", () => {
                totalDuration += audio.duration;
                loaded++;

                if (loaded === this.audioElements.length) {
                    this.durationLabel.textContent = `0:00 / ${this.formatTime(totalDuration)}`;
                    this.durationSpan.textContent = this.formatTime(totalDuration);
                    this.totalDuration = totalDuration;
                    if(this.audioProgressBar){
                        this.audioProgressBar.setAttribute("max", totalDuration);
                        this.audioProgressBar.setAttribute("value", 0);
                    }
                }
            });
        });
    }

    updateRemainingTime(countDown = false) {
        let currentTime = 0;
        let timeLeft = 0;

        for (let i = 0; i < this.audioElements.length; i++) {
            const audio = this.audioElements[i];
            if (i < this.currentPart) {
                currentTime += audio.duration;
            } else if (i === this.currentPart) {
                currentTime += audio.currentTime;
                timeLeft += audio.duration - audio.currentTime;
            } else {
                timeLeft += audio.duration;
            }
        }

        if (countDown) {
            this.durationSpan.textContent = this.formatTime(timeLeft);
        } else {
            this.durationLabel.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(this.totalDuration)}`;
        }
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

        const progress = (currentTime / totalTime);
        this.shadowRoot.querySelector(".progress-range").value = currentTime;
        this.shadowRoot.querySelector(".progress-range").style.setProperty("--progress", `${progress * 100}%`);
    }

    onMouseDown(event) {
        this.isDragging = true;
        this.startX = event.clientX - this.container.getBoundingClientRect().left;
        this.startY = event.clientY - this.container.getBoundingClientRect().top;
        this.draggableArea.style.cursor = "grabbing";
        document.addEventListener("mousemove", this.onMouseMove);
    }

    onMouseMove(event) {
        if (!this.isDragging) return;
        this.container.style.left = `${event.clientX - this.startX}px`;
        this.container.style.top = `${event.clientY - this.startY}px`;
    }

    onMouseUp() {
        this.isDragging = false;
        this.draggableArea.style.cursor = "grab";
        document.removeEventListener("mousemove", this.onMouseMove);
    }

    setupDraggable(removeDraggable = false) {
        this.draggableArea = this.shadowRoot.querySelector(".draggable-area");
        if (!removeDraggable) {
            this.draggableArea.style.pointerEvents = "all";
            this.draggableArea.addEventListener("mousedown", this.onMouseDown);
            document.addEventListener("mouseup", this.onMouseUp);
            return;
        }

        this.draggableArea.style.cursor = "auto";
        this.draggableArea.style.pointerEvents = "none";
        this.draggableArea.removeEventListener("mousedown", this.onMouseDown);
        document.removeEventListener("mouseup", this.onMouseUp);
        document.removeEventListener("mousemove", this.onMouseMove);
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
