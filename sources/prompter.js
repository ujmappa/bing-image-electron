
const shuffleArray = (array) => {
	const result = array.slice();
	const n = result.length, last = n - 1;
	for (let index = 0; index < n; index++) {
		const rand = index + Math.floor(Math.random() * (last - index + 1));
		const temp = result[index];
		result[index] = result[rand];
		result[rand] = temp;
	}
	return result;
}


class Prompter { 
	constructor(database) {
		this.database = database;
	}

	evaluate(template, category, subject) {
		const alreadyUsed = [];
		let result = template.replace(/\$\{[a-z]+([\*])*\}/gi, (match, captured) => {
			const matching = match.substring(2, match.length-(captured ? 2 : 1));
			if (matching === 'seed') {
				return Math.floor(Math.random()*4294967296);
			} else if (matching === 'chaos') {
				return Math.floor(Math.floor(Math.random()*110) / 10) * 10;
			} else if (matching === 'weird') {
				return Math.floor(Math.floor(Math.random()*1100) / 100) * 100;
			} else if (matching === 'stylize') {
				return Math.floor(Math.floor(Math.random()*1100) / 100) * 100;
			} else {
				const component = this.database[matching];
				const candidates = shuffleArray(component);
				const expressions = [], count = captured ? Math.floor(Math.random()*3) + 1 : 1;
				for (let i = 0; i < count; i++) {
					let found = false, expression;
					while (!found && candidates.length) {
						expression = candidates.shift().name.trim();
						found = alreadyUsed.indexOf(expression) === -1;
					}
					if (found) {
						expressions.push(expression); 
						alreadyUsed.push(expression);
					}
				}
				const result = expressions.join(', ');
				return result;
			} 
		});
		return result;
	}
}

module.exports = Prompter;
