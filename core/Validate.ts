
export abstract class Sanitize {
	static alpha(text: string) { return text.replaceAll(/[a-zA-Z]/g, ""); }
	static alphaNumeric(text: string) { return text.replaceAll(/[a-zA-Z0-9]/g, ""); }
	static sentence(text: string) { return text.replaceAll(/[a-zA-Z0-9\w\ \.,:\'\"\[\]\(\)\%\#;!?\-\_]/g, ""); }
}

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
	
	// Valid Strings
	static isSafeWord(word: string) { return word.match(/[a-z0-9_]/gi) ? true : false; }
	static isAlphaNumeric(word: string) { return word.match(/[a-z0-9]/gi) ? true : false; }
	
	static isName(word: string, maxLen = 0) {
		if(word.length > maxLen) { return false; }
		return word.match(/[a-z ]/gi) ? true : false;
	}
	
	static isValidSlug(slug: string) { return slug.match(/[a-z0-9-]{1,128}/gi) ? true : false; }
	
	// Note: Valid URLs are actually really tricky (:::::: is technically a valid URL), so don't rely on any bulletproof options.
	static isValidURL(url: string): boolean {
		return url.match(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi) ? true : false;
	}
	
	// Note: Technically, a "valid" email check would require pages of regex. We're only checking for basic errors, because it's impractical to exceed that.
	static isEmailFormatted(email: string): boolean {
		return email.match(/^\S+@\S+\.\S+$/) ? true : false;
	}
}