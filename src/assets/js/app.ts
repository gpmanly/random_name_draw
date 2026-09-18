import confetti from 'canvas-confetti';
import Slot from '@js/Slot';
import SoundEffects from '@js/SoundEffects';
import MD5 from 'md5/md5';

// Initialize slot machine
(() => {
  const drawButton = document.getElementById('draw-button') as HTMLButtonElement | null;
  const fullscreenButton = document.getElementById('fullscreen-button') as HTMLButtonElement | null;
  const settingsButton = document.getElementById('settings-button') as HTMLButtonElement | null;
  const settingsWrapper = document.getElementById('settings') as HTMLDivElement | null;
  const settingsContent = document.getElementById('settings-panel') as HTMLDivElement | null;
  const settingsSaveButton = document.getElementById('settings-save') as HTMLButtonElement | null;
  const settingsCloseButton = document.getElementById('settings-close') as HTMLButtonElement | null;
  const sunburstSvg = document.getElementById('sunburst') as HTMLImageElement | null;
  const confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  const nameListTextArea = document.getElementById('name-list') as HTMLTextAreaElement | null;
  const removeNameFromListCheckbox = document.getElementById('remove-from-list') as HTMLInputElement | null;
  const enableSoundCheckbox = document.getElementById('enable-sound') as HTMLInputElement | null;
  const winnersListBody = document.getElementById('winners-list-body') as HTMLTableSectionElement | null;
  const winnersDownloadButton = document.getElementById('winners-download') as HTMLButtonElement | null;
  const settingsImportButton = document.getElementById('settings-import') as HTMLButtonElement | null;
  const prizeSelection = document.getElementById('prize-selection') as HTMLDivElement | null;
  const minorPrizesButton = document.getElementById('minor-prizes-button') as HTMLButtonElement | null;
  const majorPrizesButton = document.getElementById('major-prizes-button') as HTMLButtonElement | null;
  const minorPrizesTitle = document.getElementById('minor-prizes-title') as HTMLDivElement | null;
  const majorPrizesTitle = document.getElementById('major-prizes-title') as HTMLDivElement | null;
//  const EXPECTED_HASH = '831cb0df7fc66e1168e4576bed1e7607';

  // Get the file input element and the import button
  const fileInput = document.getElementById('file-input') as HTMLInputElement;

  //const clapSound = document.getElementById('clapSound') as HTMLAudioElement;

  // Graceful exit if necessary elements are not found
  if (!(
    drawButton
    && fullscreenButton
    && settingsButton
    && settingsWrapper
    && settingsContent
    && settingsSaveButton
    && settingsCloseButton
    && sunburstSvg
    && confettiCanvas
    && nameListTextArea
    && removeNameFromListCheckbox
    && enableSoundCheckbox
    && winnersListBody
    && winnersDownloadButton
    && fileInput
    && settingsImportButton
    && prizeSelection
    && minorPrizesButton
    && majorPrizesButton
    && minorPrizesTitle
    && majorPrizesTitle
    //&& clapSound
  )) {
    console.error('One or more Element ID is invalid. This is possibly a bug.');
    return;
  }

  if (!(confettiCanvas instanceof HTMLCanvasElement)) {
    console.error('Confetti canvas is not an instance of Canvas. This is possibly a bug.');
    return;
  }

  const soundEffects = new SoundEffects();
  const MAX_REEL_ITEMS = 60;
  const CONFETTI_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
  let confettiAnimationId: number | undefined;

  // The prize type is intentionally session-only and is selected on every launch.
  const selectPrizeType = (isMajorPrize: boolean) => {
    minorPrizesTitle.style.display = isMajorPrize ? 'none' : 'inline-block';
    majorPrizesTitle.style.display = isMajorPrize ? 'inline-block' : 'none';
    prizeSelection.style.display = 'none';
    drawButton.disabled = false;
    settingsButton.disabled = false;
  };

  drawButton.disabled = true;
  settingsButton.disabled = true;
  minorPrizesTitle.style.display = 'none';
  majorPrizesTitle.style.display = 'none';

  /** Confeetti animation instance */
  const customConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
  });

  /** Triggers cconfeetti animation until animation is canceled */
  const confettiAnimation = () => {
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
    const confettiScale = Math.max(0.5, Math.min(1, windowWidth / 1100));

    customConfetti({
      particleCount: 1,
      gravity: 0.8,
      spread: 90,
      origin: { y: 0.6 },
      colors: [CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]],
      scalar: confettiScale
    });

    confettiAnimationId = window.requestAnimationFrame(confettiAnimation);
  };

  /** Function to stop the winning animation */
  const stopWinningAnimation = () => {
    if (confettiAnimationId !== undefined) {
      window.cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = undefined;
    }
    customConfetti.reset();
    sunburstSvg.style.display = 'none';
  };

  /**  Function to be trigger before spinning */
  const onSpinStart = () => {
    //clapSound.pause();
    //clapSound.currentTime = 0;
    stopWinningAnimation();
    drawButton.disabled = true;
    settingsButton.disabled = true;
    soundEffects.spin((MAX_REEL_ITEMS - 1) / 10);
  };

  /**  Functions to be trigger after spinning */
  const onSpinEnd = async () => {
    confettiAnimation();
    sunburstSvg.style.display = 'block';
    await soundEffects.win();
    //await clapSound.play();
    drawButton.disabled = false;
    settingsButton.disabled = false;
  };

  /** Slot instance */
  const slot = new Slot({
    reelContainerSelector: '#reel',
    maxReelItems: MAX_REEL_ITEMS,
    onSpinStart,
    onSpinEnd,
    onNameListChanged: stopWinningAnimation
  });

  const formatWinnerName = (name: string) => {
    return name.trim();
  };

  const formatWinnerTime = (timestamp: string) => new Date(timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const updateWinnersList = () => {
    winnersListBody.innerHTML = '';
    slot.winners.forEach(({ name, timestamp }) => {
      const row = winnersListBody.insertRow();
      row.insertCell().textContent = formatWinnerName(name);
      row.insertCell().textContent = formatWinnerTime(timestamp);
    });
    winnersDownloadButton.disabled = !slot.winners.length;
  };

  /** To open the setting page */
  const onSettingsOpen = () => {
    nameListTextArea.value = slot.names.length ? slot.names.join('\n') : '';
    removeNameFromListCheckbox.checked = slot.shouldRemoveWinnerFromNameList;
    enableSoundCheckbox.checked = !soundEffects.mute;
    settingsWrapper.style.display = 'block';
    updateWinnersList();
  };

  /** To close the setting page */
  const onSettingsClose = () => {
    settingsContent.scrollTop = 0;
    settingsWrapper.style.display = 'none';
  };

  // Click handler for "Draw" button
  drawButton.addEventListener('click', () => {
    if (!slot.names.length) {
      onSettingsOpen();
      return;
    }

    slot.spin().then((completed) => {
      if (completed) {
        updateWinnersList();
      }
    });
  });

  winnersDownloadButton.disabled = true;
  winnersDownloadButton.addEventListener('click', () => {
    if (!slot.winners.length) {
      return;
    }

    const csv = [
      ['Winner', 'Timestamp'],
      ...slot.winners.map(({ name, timestamp }) => [
        formatWinnerName(name),
        formatWinnerTime(timestamp)
      ])
    ]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}\r\n`], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'winners.csv';
    link.click();
    URL.revokeObjectURL(downloadUrl);
  });

  // Hide fullscreen button when it is not supported
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - for older browsers support
  if (!(document.documentElement.requestFullscreen && document.exitFullscreen)) {
    fullscreenButton.remove();
  }

  // Click handler for "Fullscreen" button
  fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  // Click handler for "Settings" button
  settingsButton.addEventListener('click', onSettingsOpen);

  minorPrizesButton.addEventListener('click', () => selectPrizeType(false));
  majorPrizesButton.addEventListener('click', () => selectPrizeType(true));

  // Click handler for "Save" button for setting page
  settingsSaveButton.addEventListener('click', () => {
    slot.names = nameListTextArea.value
      ? nameListTextArea.value.split(/\n/).filter((name) => Boolean(name.trim()))
      : [];
    slot.shouldRemoveWinnerFromNameList = removeNameFromListCheckbox.checked;
    soundEffects.mute = !enableSoundCheckbox.checked;
    settingsImportButton.disabled = true;
    onSettingsClose();
  });

  settingsImportButton.addEventListener('click', () => {
    const file = fileInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          //const xbinary = event.target?.result;
          const md5val = MD5(content, 'utf-8');
          const stringabc = MD5('abc');
          console.log(stringabc);
          console.log(md5val);
//          if (md5val == EXPECTED_HASH){
            const importedNames = content.split('\n').map(name => name.trim()).filter(name => name !== '');
            nameListTextArea.value = importedNames.length ? importedNames.join('\n') : '';
            console.log('Imported names:', importedNames);
//          }
//          else {
//            nameListTextArea.value = 'Hash Mismatched -- Invalid List';
//            console.error('Hash Mismatched');
//          }
        };
        reader.readAsText(file);
      
    } else {
      console.error('No file selected.');
    }
  });

  // Click handler for "Discard and close" button for setting page
  settingsCloseButton.addEventListener('click', onSettingsClose);
})();
