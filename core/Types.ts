
export const enum AwardRank {
	None = 0,
	Seed = 1,		// $0.05 for a Seed Award
	Plant = 2,		// $0.25 for a Plant Award
	Tree = 3,		// $1.00 for a Tree Award
	Druid = 4,		// $5.00 for a Druid Award
}

export const enum UserRank {
	Banned = -10,
	TemporarilyBanned = -5,
	Distrusted = -2,
	Unregistered = 0,
	Guest = 1,				// Unconfirmed Email
	User = 2,				// Confirmed Email
	PaidUser = 3,
	VIP = 4,
	Moderator = 6,
	Creator = 7,
	Admin = 8,
	Superuser = 10,
}

export const enum EmailList {
	None = 0,
	TwoPerYear = 1,
	SixPerYear = 2,
	Unlimited = 3,
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
