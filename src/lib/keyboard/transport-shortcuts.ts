export const isEditableShortcutTarget = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

export const shouldTogglePlaybackFromKeyboard = (event: KeyboardEvent) => {
  if (event.code !== "Space" || event.repeat) {
    return false;
  }

  return !isEditableShortcutTarget(event.target);
};
