
// RedisDB / Schema uses this extensively.
export const enum TableType {
	Home = "home",
	Post = "post",				// post:{forum}:{id}				// Standard Post. Added to the pagination set.
	Queue = "queue",			// queue:{forum}:{id}				// Queued Post. Awaiting moderator approval. Delete entirely if rejected.
	Sponsor = "sponsor",		// sponsor:{forum}:{id}				// Sponsored Post. Fit into the regular posts where appropriate.
}
