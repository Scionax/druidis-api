// This class provides helper functions for modifying data.

export default abstract class Data {
	
	static shuffle(arrayToShuffle: Array<unknown>) {
		let last = arrayToShuffle.length;
		let n;
		while(last > 0) {
			n = Data.randInteger(last);
			Data._arraySwap(arrayToShuffle, n, --last);
		}
	}
	
	static randInteger(maxNum: number) {
		return Math.floor(Math.random() * maxNum);
	}
	
	private static _arraySwap(arr: Array<unknown>, i: number, j: number) {
		const q = arr[i];
		arr[i] = arr[j];
		arr[j] = q;
		return arr;
	}
}
