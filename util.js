export function lerp(a, b, alpha) {
	return a + alpha * (b - a);
}

export function zip(a, b) {
	return a.map((e, i) => [e, b[i]]);
}

export function zipMany(arrays) {
	return arrays[0].map((_, i) => arrays.map(a => a[i]));
}
