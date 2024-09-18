import { thingToXML } from '@/utility/scripts/buildXML';

export class Sound {
	/**
	 *
	 * @param {string} defName
	 * @param {string} clipPath
	 * @param {string} volumeRange
	 * @param {string} pitchRange
	 */
	constructor(defName, clipPath, volumeRange, pitchRange) {
		this.defName = defName;

		this.context = MapOnly;
		this.soundSubs = [
			{
				grains: [{ clipPath: clipPath }],
			},
			{
				volumeRange: volumeRange,
			},
			{
				pitchRange: pitchRange,
			},
		];

		this.clipPath = clipPath;
		this.volumeRange = volumeRange;
		this.pitchRange = pitchRange;
	}

	buildXML() {
		thingToXML(this);
	}
}
