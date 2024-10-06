export const LABEL_MESSAGE_KEYS = {
	ENDING_IN_NUMBER: 1,
};

export function invalidLabelMessage(key) {
	switch (key) {
		case LABEL_MESSAGE_KEYS.ENDING_IN_NUMBER:
			return 'WARNING! Weapon label cannot end in an integer (0-9)';
		default:
			return '';
	}
}
