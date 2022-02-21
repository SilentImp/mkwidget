const CSS_URL = new URL('./MKCounter.css', import.meta.url).href;
const form = `<form class="controls" method="post" enctype="multipart/form-data">
<button class="love" formaction="/upvote" type="submit" aria-label="I love web-components!">
  <svg viewBox="0 0 700 500">
    <use href="#vote">
  </svg>
</button>
<button class="hate" formaction="/downvote" type="submit" aria-label="I hate web-components!">
  <svg viewBox="0 0 700 500">
    <use href="#vote">
  </svg>
</button>
</form>`;
const controls = `<button class="finishHim" type="button" aria-label="Let's see the winner!">
<svg viewBox="0 0 700 550">
  <use href="#stop">
</svg>
</button>`;
const reset = `<button class="resetVote" type="button" aria-label="Let's see the winner!">
<svg viewBox="0 0 700 550">
  <use href="#stop">
</svg>
</button>`;
const templateHTML = (hasVotes, hasControls, hasReset) => `<style>@import "${CSS_URL}";</style>
<svg
  class="sprite"
  width="700pt"
  height="700pt"
  version="1.1"
  viewBox="0 0 700 700"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <path id="vote" d="m409.98 217.64v29.961h59.977v30.016h-59.977v29.961h59.977v30.016h-59.977v29.961h59.977v29.961l-209.89-0.003906v-29.961h-30.016v-149.91h30.016v-59.977h29.961v-29.961h30.016v-30.016h29.961v59.977h-29.961v30.016h149.91v29.961z"/>
    <path id="stop" d="m472.17 144.14v271.71h-30.184v30.184h-181.16v-30.184h-30.184v-30.184h-30.184v-120.73h30.184v90.551h30.184v-241.53h30.184v150.98h30.184l0.003906-60.426h30.184v60.426h30.238v-60.426h30.184v60.426h30.184v-120.79z"/>
  </defs>
</svg>
<div class="container">
  <h1 class="result">Web Components Failed</h1> 
  <div class="liu">
    <div class="blood"></div>
  </div>
  <div class="scene"></div>
  <div class="cloud"></div>
  <meter class="live" min="0" max="100" low="50" high="50" optimum="100" value="100"></meter>
  ${hasVotes ? form : ''}
  ${hasControls ? controls : ''}
  ${hasReset ? reset : ''}
</div>`;

const SPRITE_CONTAINER_HEIGHT = 125;

const SCENE_CLASS = {
  fail: 'fail',
  win: 'win',
  failing: 'failing',
  winning: 'winning',
};

const LABELS = {
  fail: 'Web Components Failed',
  win: 'Web Components Wins',
};

class MKCounter extends HTMLElement {
  static votes = 0;
  static upvotes = 0;

  constructor () {
    super();
    this.attachShadow({mode: 'open'});

    const template = document.createElement('TEMPLATE');
    template.innerHTML = templateHTML(this.dataset.votes !== undefined, this.dataset.controls !== undefined, this.dataset.reset !== undefined);
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.submitHandler = this.submitHandler.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.votesUpdated = this.votesUpdated.bind(this);
    this.updateMeter = this.updateMeter.bind(this);
    this.updateScene = this.updateScene.bind(this);
    this.finishHimHandler = this.finishHimHandler.bind(this);
    this.resetHandler = this.resetHandler.bind(this);
    this.resizeHandler = this.resizeHandler.bind(this);

    const events = new EventSource('/events');
    events.onmessage = this.votesUpdated;
  }

  votesUpdated(event) {
    const {
      votes,
      upvotes,
      isFinished,
    } = JSON.parse(event.data);
    MKCounter.votes = votes;
    MKCounter.upvotes = upvotes;
    MKCounter.isFinished = isFinished;
    this.updateMeter();
  };

  updateMeter() {
    this.meter.setAttribute("value", MKCounter.upvotes);
    this.meter.setAttribute("max", MKCounter.votes);
    this.meter.setAttribute("optimum", MKCounter.votes);
    this.meter.setAttribute("high", Math.round(MKCounter.votes / 2));
    this.meter.setAttribute("low", Math.round(MKCounter.votes / 2));
    this.meter.setAttribute("upvotes", Math.round(MKCounter.votes / 2));
    this.style.setProperty('--up-votes', MKCounter.upvotes);
    this.style.setProperty('--down-votes', MKCounter.votes - MKCounter.upvotes);
    this.updateScene();
  }

  updateScene() {
    const winning = MKCounter.votes/2 <= MKCounter.upvotes;
    if (!MKCounter.isFinished) {
      this.container.classList.toggle(SCENE_CLASS.failing, !winning);
      this.container.classList.toggle(SCENE_CLASS.winning, winning);
    } else {
      this.container.classList.remove(SCENE_CLASS.failing);
      this.container.classList.remove(SCENE_CLASS.winning);
      this.container.classList.toggle(SCENE_CLASS.fail, !winning);
      this.container.classList.toggle(SCENE_CLASS.win, winning);
    }
  }

  connectedCallback() {
    this.container = this.shadowRoot.querySelector('.container');

    const vh = window.innerHeight;
    const scale = vh*.5/SPRITE_CONTAINER_HEIGHT;
    this.container.style.setProperty('--height', `${vh}px`);
    this.container.style.setProperty('--scale', scale);

    this.meter = this.container.querySelector('.live');
    this.label = this.container.querySelector('.result');
    this.form = this.container.querySelector('.controls');
    if (this.form !== null) {
      this.form.addEventListener('submit', this.submitHandler);
      this.form.querySelectorAll('button').forEach(button => button.addEventListener('click', this.clickHandler));
    }
    this.finishHim = this.container.querySelector('.finishHim');
    if (this.finishHim !== null) {
      this.finishHim.addEventListener('click', this.finishHimHandler);
    }

    this.resetVote = this.container.querySelector('.resetVote');
    if (this.resetVote !== null) {
      this.resetVote.addEventListener('click', this.resetHandler);
    }

    this.updateMeter();

    const observer = new ResizeObserver(this.resizeHandler);
    observer.observe(window.document.body);
    
  }

  resizeHandler() {
    const vh = window.innerHeight;
    const scale = vh*.5/SPRITE_CONTAINER_HEIGHT;
    this.container.style.setProperty('--height', `${vh}px`);
    this.container.style.setProperty('--scale', scale);

    this.container.classList.remove(SCENE_CLASS.failing);
    this.container.classList.remove(SCENE_CLASS.winning);
    this.container.classList.remove(SCENE_CLASS.win);
    this.container.classList.remove(SCENE_CLASS.fail);

    setTimeout(this.updateScene, 0);
  }

  submitHandler(event) {
    event.preventDefault();
  }

  clickHandler(event) {
    const button = event.currentTarget;
    const formaction = button.getAttribute('formaction');
    button.blur();
    const data = new FormData();
    data.append('ajax', 'true');
    navigator.sendBeacon(formaction, data);
  }

  resetHandler() {
    const data = new FormData();
    data.append('code', window.code);
    navigator.sendBeacon('/reset', data);
  }

  finishHimHandler() {
    const winning = MKCounter.votes/2 <= MKCounter.upvotes;
    this.container.classList.remove(SCENE_CLASS.failing);
    this.container.classList.remove(SCENE_CLASS.winning);
    this.container.classList.toggle(SCENE_CLASS.win, winning);
    this.container.classList.toggle(SCENE_CLASS.fail, !winning);
    this.label.textContent = winning ? LABELS.win : LABELS.fail;
    const data = new FormData();
    data.append('code', window.code);
    navigator.sendBeacon('/finish', data);
  }
}

customElements.define('mk-counter', MKCounter);

export default MKCounter;