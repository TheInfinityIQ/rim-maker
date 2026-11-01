import { availableDefinitions } from '@/utility/gameDefinitions';

export default function getSoundsForCascadeSelect(definitions = availableDefinitions('sounds')) {
	const groupedSounds = definitions.reduce((groups, sound) => {
		const prefix = sound.defName.includes('_') ? sound.defName.split('_')[0] : 'Miscellaneous';
		(groups[prefix] ||= []).push(sound.defName);
		return groups;
	}, {});
	const mainOptions = new Set(['Shot', 'Interact', 'GunTail']);

	const cascadeSelectOptions = [];
	const otherOptions = {
		label: 'Other',
		children: [],
	};

	for (const [prefix, defNames] of Object.entries(groupedSounds)) {
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
