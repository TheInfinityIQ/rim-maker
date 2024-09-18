import sounds from '@/utility/data/sounds.json';

export default function getSoundsForCascadeSelect() {
	const mainOptions = new Set(['Shot', 'Interact', 'GunTail']);

	const cascadeSelectOptions = [];
	const otherOptions = {
		label: 'Other',
		children: [],
	};

	for (const [prefix, defNames] of Object.entries(sounds)) {
		const arrRef = mainOptions.has(prefix) ? cascadeSelectOptions : otherOptions.children;
		arrRef.push({
			label: prefix,
			children: defNames.map((defName) => ({
				label: defName,
			})),
		});
	}

	cascadeSelectOptions.push(otherOptions);
	return cascadeSelectOptions;
}
