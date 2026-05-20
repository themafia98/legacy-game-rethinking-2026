const PLAYER_NAME_KEY = 'arena_player_name';
const DEFAULT_PLAYER_NAME_PREFIX = 'player-';

export function getStoredPlayerName(): string | null {
  return localStorage.getItem(PLAYER_NAME_KEY);
}

export function savePlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

export function promptPlayerName(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve) => {
    const bgModal = document.createElement('div');
    bgModal.classList.add('background-modal');

    const modal = document.createElement('div');
    modal.classList.add('modal-window');

    const center = document.createElement('div');
    center.classList.add('center');

    const input = document.createElement('input');
    input.classList.add('name');
    input.type = 'text';
    input.maxLength = 11;
    input.placeholder = 'NAME';

    const saveBtn = document.createElement('input');
    saveBtn.classList.add('btnName');
    saveBtn.type = 'button';
    saveBtn.value = 'SAVE';

    const cancelBtn = document.createElement('input');
    cancelBtn.classList.add('cancelName');
    cancelBtn.type = 'button';
    cancelBtn.value = 'NO';

    const finish = (name: string): void => {
      bgModal.remove();
      savePlayerName(name);
      resolve(name);
    };

    saveBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (name) finish(name);
    });

    cancelBtn.addEventListener('click', () => {
      finish(`${DEFAULT_PLAYER_NAME_PREFIX}${Date.now().toString(36).slice(-4)}`);
    });

    center.appendChild(input);
    center.appendChild(saveBtn);
    center.appendChild(cancelBtn);
    modal.appendChild(center);
    bgModal.appendChild(modal);

    document.body.insertBefore(bgModal, canvas);
    input.focus();
  });
}
