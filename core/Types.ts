
// RedisDB / Schema uses this extensively.
export const enum TableType {
	Home = "home",
	Post = "post",				// post:{forum}:{id}				// Standard Post. Added to the pagination set.
	Queue = "queue",			// queue:{forum}:{id}				// Queued Post. Awaiting moderator approval. Delete entirely if rejected.
	Sponsor = "sponsor",		// sponsor:{forum}:{id}				// Sponsored Post. Fit into the regular posts where appropriate.
}

export const enum AccountValidation {
	Valid = 0,
	
	// Missing Values
	MustProvideUsername = 1,
	MustProvideEmail = 2,
	MustProvidePassword = 3,
	
	// Already Taken
	UsernameTaken = 5,
	EmailTaken = 6,
	
	// Invalid Lengths
	UsernameTooShort = 10,				// Three Character Minimum
	UsernameTooLong = 11,
	PasswordTooShort = 12,				// Six Characters Required
	FreeAccountTooShort = 13,			// Six Characters Required
	
	// Password
	PasswordDoesNotMatch = 15,
	
	// Invalid Values
	UsernameInvalid = 20,				// Letters, numbers, and underscores.
	EmailInvalid = 21,
	PasswordInvalid = 22,
	FreeAccountRequiredChars = 23,		// Must contain a number or underscore.
	
	// Other Issues
	AccountBanned = 30,
	CannotPerformAction = 31,
}
