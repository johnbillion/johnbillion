import {readFile, writeFile} from 'node:fs/promises';
import {Resvg} from '@resvg/resvg-js';

const [input, output, widthStr] = process.argv.slice(2);
if (!input || !output) {
	console.error('usage: render.mjs <input.svg> <output.png> [width]');
	process.exit(1);
}

// ghsvg embeds avatars as `data:image/png;base64,...` regardless of the actual
// bytes (some are JPEG). resvg validates the declared MIME and refuses to
// decode mismatched payloads, so sniff each base64 prefix and relabel.
const svg = (await readFile(input, 'utf8')).replace(
	/data:image\/[a-z]+;base64,([A-Za-z0-9+/]{10})/g,
	(_, prefix) => {
		let mime = 'png';
		if (prefix.startsWith('/9j/')) mime = 'jpeg';
		else if (prefix.startsWith('R0lGOD')) mime = 'gif';
		else if (prefix.startsWith('UklGR')) mime = 'webp';
		return `data:image/${mime};base64,${prefix}`;
	}
);

const opts = widthStr
	? {fitTo: {mode: 'width', value: Number(widthStr)}}
	: {};
const png = new Resvg(svg, opts).render().asPng();
await writeFile(output, png);
