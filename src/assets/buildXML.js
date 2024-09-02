export default function exportXML(weapons) {
	const content = objectToXML(weapons[0], 'ThingDef');
	const file = new File([content], 'test.xml', {
		type: 'text/xml',
	});
	const url = URL.createObjectURL(file);

	const link = document.createElement('a');
	link.href = url;
	link.download = file.name;

	document.body.appendChild(link);
	link.click();

	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

function objectToXML(obj, rootElement) {
	let xml = `<${rootElement}>\n`;

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'object') {
			xml += objectToXML(value, key) + '\n';
		} else {
			xml += `<${key}>${value}</${key}>\n`;
		}
	}

	xml += `</${rootElement}>`;
	return xml;
}
