
export default abstract class Validate {
	
	static safeText(text: string): string {
		
		// Remove Newlines
		text = text.replaceAll(/[\r\n]/g, "");
		
		// Replace XSS symbols with HTML-space replacements
		const table: { [id: string]: string } = {
			'<': 'lt',
			'>': 'gt',
			'"': 'quot',
			'\'': 'apos',
			// '&': 'amp',
			'\r': '#10',
			'\n': '#13'
		};
		
		return text.toString().replace(/[<>"'\r\n&]/g, function(chr){
			return '&' + table[chr] + ';';
		});
	}
	
	static isSafeWord(word: string) {
		return word.match(/[a-z0-9_]/gi) ? true : false;
	}
	
	static isAlphaNumeric(word: string) {
		return word.match(/[a-z0-9]/gi) ? true : false;
	}
	
	static isValidSlug(slug: string) {
		return slug.match(/[a-z0-9-]{1,128}/gi) ? true : false;
	}
	
	// Note: Valid URLs are actually really tricky (:::::: is technically a valid URL), so don't rely on any bulletproof options.
	static isValidURL(url: string): boolean {
		return url.match(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi) ? true : false;
	}
}