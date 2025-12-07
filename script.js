// https://www.imranmanzoor.com
// Refactored & Fixed for Visibility/Overlap Issues

const panels = document.querySelectorAll('.panel1');
const secondaryPanels = document.querySelectorAll('.panel2');
const numberOfPanels = 12;
const rotationCoef = 5;
let elHeight = window.innerHeight / numberOfPanels;
let elWidth = window.innerWidth / numberOfPanels;

// Selectors for Intro Text
const textCallout = document.querySelector('.intro-group .callout');
const textSub = document.querySelector('.intro-group .subtitle');

// --- CONFIG ---
const DURATION_VILA = 10; 

const TEXT_TIMING = {
  inDelay: 1.2,
  inDuration: 1,
  moveUpDelay: 3,
  moveUpDuration: 0.5,
  subtitleDelay: 3,
  subtitleDuration: 0.5,
  exitDelay: 1.2,
  exitDuration: 1
};

function updateElementSize() {
  elHeight = window.innerHeight / numberOfPanels;
  elWidth = window.innerWidth / numberOfPanels;
}

function createMasterTimeline() {
  const tl = gsap.timeline({ repeat: -1 });

  gsap.set(".text-group", { autoAlpha: 0 });
  gsap.set(".intro-group", { autoAlpha: 1 });

  addTextAnimations(tl);      // Intro
  addPanelAnimations(tl);     // Panels + Rest Texts

  return tl;
}

// --- PHASE 1: Intro text ---
function addTextAnimations(tl) {
  // Intro Callout enters
  tl.fromTo(
    textCallout,
    { left: '150%' },
    {
      left: '50%',
      ease: 'expo.out',
      duration: TEXT_TIMING.inDuration,
      delay: TEXT_TIMING.inDelay
    },
    0
  );

  // Intro Callout moves UP
  tl.to(
    textCallout,
    {
      y: '-60px',
      delay: TEXT_TIMING.moveUpDelay,
      duration: TEXT_TIMING.moveUpDuration,
      ease: 'sine.out'
    },
    0
  );

  // Intro Subtitle fades in
  tl.fromTo(
    textSub,
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      ease: 'sine.out',
      duration: TEXT_TIMING.subtitleDuration,
      delay: TEXT_TIMING.subtitleDelay
    },
    0
  );

  // Intro Exit
  tl.to(
    [textCallout, textSub],
    {
      left: '-150%',
      ease: 'sine.in',
      duration: TEXT_TIMING.exitDuration,
      delay: TEXT_TIMING.exitDelay
    },
    4
  );
  

  tl.set(".intro-group", { autoAlpha: 0 }, ">");
}

// --- HELPER: Insert Rest Text Animation ---
function insertRestText(tl, groupIndex, duration) {
  const groupClass = `.rest-group-${groupIndex}`;
  const group = document.querySelector(groupClass);
  
  if (!group) return;
  
  const title = group.querySelector('.callout');
  const sub = group.querySelector('.subtitle');
  const listItems = group.querySelectorAll('.list-item'); 
  

  const startLabel = `restGroupStart_${groupIndex}`;
  tl.addLabel(startLabel, "<"); 
  
  // --- KONFIGURATION ---
  const TITLE_ENTER_DURATION = 0.8;
  const MOVE_UP_DELAY = 1.0;
  const EXIT_DURATION = 0.8; 
  const EXIT_MARGIN = 0.2;     // Marginal för att hinna släcka innan byte
  const MIN_READ_TIME = 2.0;
  const MAX_STEP = 3.2;

  // 1. Tänd containern (vid ankaret)
  tl.set(group, { autoAlpha: 1 }, startLabel);

  // 2. Titel swishar in (vid ankaret)
  tl.fromTo(title, 
    { left: '150%', y: 0 }, 
    {
      left: '50%',
      ease: 'expo.out',
      duration: TITLE_ENTER_DURATION
    },
    startLabel
  );

  // 3. Titel flyttar UPP
  tl.to(title, 
    {
      y: '-60px', 
      ease: 'sine.out',
      duration: 0.5
    },
    `${startLabel}+=${MOVE_UP_DELAY}`
  );

  // --- DYNAMISK LIST-ANIMATION ---
  if (listItems.length > 0) {
    const listStartTime = MOVE_UP_DELAY + 0.3; 
    const absoluteExitStartTime = duration - EXIT_DURATION - EXIT_MARGIN;
    const timeWindowForList = absoluteExitStartTime - listStartTime - MIN_READ_TIME;
    
    let step = 0;
    if (listItems.length > 1) {
      step = Math.min(MAX_STEP, timeWindowForList / (listItems.length - 1));
      if (step < 0.3) step = 0.5; // Säkerhetsspärr
    }

    const PUSH_DISTANCE = "-=30px"; 

    listItems.forEach((item, i) => {
      const myDelay = listStartTime + (i * step);
      // VIKTIGT: Nu räknar vi alltid från startLabel
      const myAbsTime = `${startLabel}+=${myDelay}`;

      if (i > 0) {
        // Knuffa upp
        const previousItems = Array.from(listItems).slice(0, i);
        const elementsToPush = [title, ...previousItems];

        tl.to(elementsToPush, 
          { 
            y: PUSH_DISTANCE, 
            duration: 0.5,
            ease: "sine.inOut"
          }, 
          myAbsTime 
        );
        
        tl.to(listItems[i-1], { opacity: 0.9, duration: 0.5 }, myAbsTime);
      }

      // Tona in
      tl.fromTo(item,
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          ease: "sine.out" 
        },
        myAbsTime 
      );
    });

  } else if (sub) {
    // === VANLIG TEXT ===
    tl.fromTo(sub,
      { opacity: 0, y: 20 },
      {
        opacity: 1, 
        y: 0,
        ease: 'sine.out',
        duration: 0.5
      },
      `${startLabel}+=${MOVE_UP_DELAY}`
    );
  }

  // 4. Exit
  // Nu räknar vi strikt från startLabel. Inget driftande.
  const exitStartTime = `${startLabel}+=${duration - EXIT_DURATION - EXIT_MARGIN}`;
  
  const elementsToExit = [title, sub, ...listItems].filter(el => el);
  
  tl.to(elementsToExit, 
    {
      left: '-150%',
      ease: 'sine.in',
      duration: EXIT_DURATION
    },
    exitStartTime
  );
  
  // 5. Släck containern
  // För säkerhets skull sätter vi denna till exakt sluttiden också
  tl.set(group, { autoAlpha: 0 }, `${startLabel}+=${duration}`);
}

// --- PHASE 2: Panel Animations ---
function addPanelAnimations(tl) {
  panels.forEach((panel, i) => {
    const { stopPosition, wi, he } = getPrimaryPanelMetrics(i);

    // 1) Initial reveal
    tl.fromTo(
      panel,
      {
        y: elHeight * 5.5,
        x: elWidth * 5.5,
        width: 0,
        height: 0,
        rotation: -360,
        background: `linear-gradient(105deg,rgba(255, 149, 236, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1) ${stopPosition}%)`
      },
      {
        width: wi,
        height: he,
        y: -elHeight / 1.33 + ((12 - i) * elHeight) / 1.33,
        x: 0,
        duration: 1 + 0.1 * (12 - i),
        ease: 'sine.inOut',
        rotation: 0,
        background: `linear-gradient(105deg,rgba(255, 149, 236, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  ${stopPosition}%)`
      },
      0
    );

    // 2) Linear rotation phase
    tl.to(
      panel,
      {
        rotation: 12 * rotationCoef - (i + 1) * rotationCoef,
        duration: 3,
        background: `linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  ${stopPosition}%)`,
        ease: 'linear'
      },
      '>'
    );

    // 3) Reordering phase
    tl.to(
      panel,
      {
        rotation: 360,
        y: -elHeight / 6 + ((12 - i) * elHeight) / 6,
        x: -elWidth / 1.2 + ((12 - i) * elWidth) / 1.2,
        background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
        ease: 'sine.inOut',
        duration: 1
      },
      '>'
    );

    // 4) Second linear rotation
    tl.to(
      panel,
      {
        rotation: 12 * rotationCoef - (i + 1) * rotationCoef + 360,
        duration: 4,
        background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
        ease: 'linear'
      },
      '>'
    );

    if (i === 0) {
      tl.addLabel('splitStart', '-=0.8');
    }

    addSecondaryPanelsSegment(tl, i);

    // Outro for primary panels
    if (i === 0) {
      tl.to(
        panel,
        {
          rotation: 720 + 90,
          y: window.innerHeight - ((12 - i) * elHeight) / 4,
          x: -elWidth / 2 + ((12 - i) * elWidth) / 2,
          width: 0,
          height: 0,
          opacity: 0,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
          ease: 'sine.inOut',
          duration: 1
        },
        'splitStart' + '+=' + String(0.05 * i)
      );
    } else {
      tl.to(
        panel,
        {
          rotation: 720 + 90,
          y: window.innerHeight - ((12 - i) * elHeight) / 4,
          x: -elWidth / 2 + ((12 - i) * elWidth) / 2,
          width: wi,
          height: wi,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
          ease: 'sine.inOut',
          duration: 1
        },
        'splitStart' + '+=' + String(0.05 * i)
      );

      // --- VILA #1 ---
      // Skapa ett unikt namn för just denna tidpunkt
      const labelVila1 = `p${i}_vila1`;
      tl.addLabel(labelVila1, ">"); // Sätt etiketten precis där vi är nu

      tl.to(
        panel,
        {
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 810,
          duration: DURATION_VILA,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
          ease: 'linear'
        },
        labelVila1 // Starta exakt på etiketten
      );

      // INJECT TEXT FOR VILA 1
      if (i === 1) insertRestText(tl, 1, DURATION_VILA);

      tl.to(
        panel,
        {
          y: window.innerHeight - ((12 - i) * elHeight) / 2,
          x: 0 - elWidth * 1.2,
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 1180,
          ease: 'sine.inOut',
          duration: 1,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)'
        },
        // HÄR VAR FELET: Vi använde '>'. Nu använder vi etiketten + tiden.
        `${labelVila1}+=${DURATION_VILA}`
      );

      // --- VILA #2 ---
      const labelVila2 = `p${i}_vila2`;
      tl.addLabel(labelVila2, ">");

      tl.to(
        panel,
        {
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 1200,
          duration: DURATION_VILA,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
          ease: 'linear'
        },
        labelVila2
      );
      
      // INJECT TEXT FOR VILA 2
      if (i === 1) insertRestText(tl, 2, DURATION_VILA);

      tl.to(
        panel,
        {
          y: window.innerHeight - ((12 - i) * elHeight) / 4,
          x: -elWidth / 2 + ((12 - i) * elWidth) / 2,
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 700,
          ease: 'sine.inOut',
          duration: 1,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)'
        },
        `${labelVila2}+=${DURATION_VILA}`
      );

      // --- VILA #3 ---
      const labelVila3 = `p${i}_vila3`;
      tl.addLabel(labelVila3, ">");

      tl.to(
        panel,
        {
          rotation: '+=30',
          duration: DURATION_VILA,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
          ease: 'linear'
        },
        labelVila3
      );

      // INJECT TEXT FOR VILA 3
      if (i === 1) insertRestText(tl, 3, DURATION_VILA);

      tl.to(
        panel,
        {
          y: window.innerHeight - ((12 - i) * elHeight) / 2,
          x: 0 - elWidth * 1.2,
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 700,
          ease: 'sine.inOut',
          duration: 1,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)'
        },
        `${labelVila3}+=${DURATION_VILA}`
      );

      // --- VILA #4 ---
      const labelVila4 = `p${i}_vila4`;
      tl.addLabel(labelVila4, ">");

      tl.to(
        panel,
        {
          rotation: '+=15',
          duration: DURATION_VILA,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
          ease: 'linear'
        },
        labelVila4
      );

      // INJECT TEXT FOR VILA 4
      if (i === 1) insertRestText(tl, 4, DURATION_VILA);

      tl.to(
        panel,
        {
          y: window.innerHeight - ((12 - i) * elHeight) / 4,
          x: -elWidth / 2 + ((12 - i) * elWidth) / 2,
          rotation: '+=140',
          ease: 'sine.inOut',
          duration: 1,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)'
        },
        `${labelVila4}+=${DURATION_VILA}`
      );

      // --- VILA #5 ---
      const labelVila5 = `p${i}_vila5`;
      tl.addLabel(labelVila5, ">");

      tl.to(
        panel,
        {
          rotation: '+=30',
          duration: DURATION_VILA,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)',
          ease: 'linear'
        },
        labelVila5
      );

      // INJECT TEXT FOR VILA 5
      if (i === 1) insertRestText(tl, 5, DURATION_VILA);
      
      tl.to(
        panel,
        {
          y: '+=' + String(elHeight * 4),
          x: '-=' + String(elWidth * 4),
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 1500,
          ease: 'sine.inOut',
          duration: 1,
          background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)'
        },
        `${labelVila5}+=${DURATION_VILA}`
      );
    }
  });
}

// Compute dimensions & gradient stop for a primary panel
function getPrimaryPanelMetrics(i) {
  const stopPosition = 100 - i * 1;
  const wi = window.innerWidth - elWidth * (12 - i) + elWidth;
  const he = window.innerHeight - elHeight * (12 - i) + elHeight;
  return { stopPosition, wi, he };
}

// Secondary panels sequence (Helper - Unchanged logic mostly)
function addSecondaryPanelsSegment(tl, panelIndex) {
  secondaryPanels.forEach((twoPanel, index) => {
    const wi2 = window.innerWidth - elWidth * index + elWidth;

    tl.fromTo(twoPanel,
      { y: elHeight * 5.5, x: elWidth * 5.5, width: 0, height: 0, rotation: -360, background: 'linear-gradient(105deg,rgba(255, 149, 236, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1) 100%)' },
      { rotation: -90, y: 0 + (index * elHeight) / 4 - wi2, x: -elWidth / 2 + (index * elWidth) / 2, width: wi2, height: wi2, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'sine.inOut', duration: 1 },
      'splitStart' + '+=' + String(0.05 * index)
    );

    // Sekundära vilor
    tl.to(twoPanel, { rotation: 12 * rotationCoef - (12 - index) * rotationCoef - 90, duration: DURATION_VILA, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'linear' }, '>');
    tl.to(twoPanel, { rotation: -300, y: 0 + (index * elHeight) / 2 - wi2, x: window.innerWidth * 1.1 - wi2 * 1.2, width: wi2, height: wi2, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'sine.inOut', duration: 1 }, '>');
    
    tl.to(twoPanel, { rotation: '-=15', duration: DURATION_VILA, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'linear' }, '>');
    tl.to(twoPanel, { rotation: -130, y: 0 + (index * elHeight) / 4 - wi2, x: -elWidth / 2 + (index * elWidth) / 2, width: wi2, height: wi2, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'sine.inOut', duration: 1 }, '>');

    tl.to(twoPanel, { rotation: '-=30', duration: DURATION_VILA, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'linear' }, '>');
    tl.to(twoPanel, { rotation: 200, y: 0 + (index * elHeight) / 2 - wi2, x: window.innerWidth * 1.1 - wi2 * 1.2, width: wi2, height: wi2, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'sine.inOut', duration: 1 }, '>');

    tl.to(twoPanel, { rotation: '+=15', duration: DURATION_VILA, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'linear' }, '>');
    tl.to(twoPanel, { rotation: -90, y: 0 + (index * elHeight) / 4 - wi2, x: -elWidth / 2 + (index * elWidth) / 2, width: wi2, height: wi2, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'sine.inOut', duration: 1 }, '>');

    tl.to(twoPanel, { rotation: '+=30', duration: DURATION_VILA, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'linear' }, '>');
    tl.to(twoPanel, { rotation: '+=360', y: '-=' + String(wi2 * 2), x: '+=' + String(wi2 * 2), width: wi2, height: wi2, background: 'linear-gradient(90deg,rgba(255, 180, 200, 1) 0%,rgba(255, 89, 226, 1) 6%,rgba(255, 0, 211, 1) 19%,rgba(255, 0, 0, 1) 72%,rgba(0, 0, 0, 1)  100%)', ease: 'sine.inOut', duration: 1 }, '>');
  });
}

// --- INITIERING MED START-SKÄRM ---
// Denna del ersätter den gamla initieringen för att hantera klick-starten

let tl; // Deklarera variabeln globalt men tilldela inget än
let hasStarted = false; // Håll koll på om vi startat

// Hämta overlay
const startOverlay = document.getElementById('start-overlay');

// Funktion för att dra igång allt
function startPresentation() {
  if (hasStarted) return; // Förhindra dubbelklick
  hasStarted = true;

  // 1. Starta animationen
  tl = createMasterTimeline();

  // 2. Tona ut startskärmen
  startOverlay.classList.add('hidden');
  
  // (Valfritt: Om du vill ta bort elementet helt ur DOM efter toningen)
  setTimeout(() => {
    startOverlay.style.display = 'none';
  }, 1000);
}

// Lyssna på klick på hela overlayen
// (Förutsätter att du lagt in <div id="start-overlay">...</div> i din HTML)
if (startOverlay) {
  startOverlay.addEventListener('click', startPresentation);
} else {
  // Fallback om overlay saknas (t.ex. vid testning utan HTML-ändring)
  console.warn("Start overlay hittades inte, startar direkt.");
  tl = createMasterTimeline();
}

// --- RESIZE HANDLING ---
// Vi vill bara hantera resize om presentationen faktiskt har börjat
window.addEventListener('resize', () => {
  if (hasStarted && tl) {
    updateElementSize();
    tl.kill(); // Döda den gamla
    tl = createMasterTimeline(); // Starta en ny anpassad efter fönstret
  }
});
