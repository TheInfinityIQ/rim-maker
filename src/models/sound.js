import { thingToXML } from '@/utility/scripts/buildXML';

export class Sound {
	/**
	 *
	 * @param {string} defName
	 * @param {string} clipPath
	 * @param {string} volumeRange
	 * @param {string} pitchRange
	 */
	constructor(
		defName,
		clipPath,
		isGunTail = false,
		volumeRange = '40~45',
		pitchRange = '0.8940217~1.084783'
	) {
		this.defName = defName;

		this.context = 'MapOnly';
		this.subSounds = [
			{
				grains: [{ clipPath: clipPath }],
				volumeRange: volumeRange,
				pitchRange: pitchRange,
			},
		];

		this.isGunTail = isGunTail;
	}

	buildXML() {
		return this.isGunTail
			? `<SoundDef>
				<defName>${this.defName}</defName>
				<context>MapOnly</context>
				<maxVoices>2</maxVoices>
				<maxSimultaneous>1</maxSimultaneous>
				<subSounds>
					<li>
						<onCamera>True</onCamera>
						<grains>
						<li Class="AudioGrain_Clip">
							<clipPath>${this.subSounds[0].grains[0].clipPath}</clipPath>
						</li>
						</grains>
						<volumeRange>${this.subSounds[0].volumeRange}</volumeRange>
						<pitchRange>${this.subSounds[0].pitchRange}</pitchRange>
						<sustainLoop>False</sustainLoop>
					</li>
				</subSounds>
			</SoundDef>`
			: `
			<SoundDef>
				<defName>${this.defName}</defName>
				<context>MapOnly</context>
				<maxSimultaneous>1</maxSimultaneous>
				<subSounds>
					<li>
						<grains>
						<li Class="AudioGrain_Clip">
							<clipPath>${this.subSounds[0].grains[0].clipPath}</clipPath>
						</li>
						</grains>
						<volumeRange>${this.subSounds[0].volumeRange}</volumeRange>
						<pitchRange>${this.subSounds[0].pitchRange}</pitchRange>
					</li>
				</subSounds>
			</SoundDef>
		`;
	}
}
