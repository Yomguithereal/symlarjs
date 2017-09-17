import { GAP, LEVENSHTEIN, EN_GB_PHONE } from './cost-functions.js';
import * as britfone from './britfone.2.0.1.json';

const { min, max, abs, floor, ceil } = Math,
undef = obj => typeof(obj) === 'undefined',
    ε = GAP;

//data structures to hold lattices's cost values, global for performance reasons
const prev_row = [];
let prev_col = [],
    curr_col = [],
    swap;

/**
 * An edit operation cost function.
 * It should accept the {@link GAP} symbol as a first argument for left gap, aka right-deletion, and as a second argument
 * for right gap aka right-insertion. The costs must be non-negative. Costs for substitution of identical symbols will be ignored 
 *  by similarity/distance functions and taken to be zero.
 * 
 * <i>Due to loss of precision when doing floating point operations, the range of costs should be as small as possible
 * to preserve accuracy of results; for the same reason, very small numbers, less than 1e-20, should be avoided</i>
 * 
 * <i>Parameters are not checked for validity</i>.
 *
 * @callback cost-function
 * @param {string} left - a non-empty symbol in the left (L) string/array, or the {@link GAP} symbol
 * @param {string} right - a non-empty symbol in the right (R) string/array, or the {@link GAP} symbol
 * @property {float} [min_cost] - the minimum edit cost possible, excluding identical symbols, if missing will be assumed to be 0;
 * @property {float} [max_cost] - the maximum edit cost possible, if missing will be assumed to be 1;
 * @return {float} non-negative cost
 */

/**
 * Computes the weighted edit distance between left (L) and right (R) strings/arrays with the given edit cost function. The weights/costs
 * are given by the cost_fn parameter.
 * 
 * Time complexity: O(|L|·|R|)
 * 
 * Space complexity: O(|R|)
 * 
 * <i>Parameters are not checked for validity</i>.
 * 
 * @param {(string|Array.string)} L - a non-empty string/array excluding the {@link GAP}
 * @param {(string|Array.string)} R - a non-empty string/array excluding the {@link GAP}
 * @param {cost-function} cost_fn - an edit cost function
 * @return {float} edit distance in [0, ∞)
 */
// implementation inspired by https://github.com/hiddentao/fast-levenshtein
export function eddist(L, R, cost_fn)
{
    if (L === R) return 0;

    const
        h = L.length + 1,
        v = R.length + 1;

    prev_row[0] = 0;
    for (let c = 1; c < h; c++) //right gap cost for all steps, first state
        prev_row[c] = prev_row[c - 1] + cost_fn(L[c - 1], ε);

    for (let r = 1, prev, curr, prev_step, tmp; r < v; r++)
    {
        prev = prev_row[0]; // substitution cost for first state, r-th step
        prev_step = prev + cost_fn(ε, R[r - 1]); // left gap cost
        prev_row[0] = prev_step; // right gap cost

        for (let c = 1; c < h; c++)
        {
            // this block finds the minimum edit cost
            // it uses a step by step comparision instead of Math.min  for peformance reasons (x4 factor)
            curr = prev + (L[c - 1] === R[r - 1] ? 0 : cost_fn(L[c - 1], R[r - 1])); //substitution cost
            tmp = prev_row[c] + cost_fn(ε, R[r - 1]); //left gap cost

            if (curr > tmp)
                curr = tmp;

            tmp = prev_step + cost_fn(L[c - 1], ε); //right gap cost

            if (curr > tmp)
                curr = tmp;
            // this block, together with the one inside the outer loop, implements the cell swapping trick
            // that allows the use of a single array for both current and previous values
            prev = prev_row[c]; // next row/state's substitution cost set to previous step's cost
            prev_step = curr; // next step's right gap cost set to this step and state cost
            prev_row[c] = curr; // next step's left gap cost set to this step and state cost
        }
    }

    return prev_row[h - 1];
}

const inf = Number.MAX_SAFE_INTEGER;
/**
 * Verifies that left and right string's weighted edit distance is no greater than the max_dist threshold. 
 * The weights/costs are given by the cost_fn parameter. This is equivalent to verifiying {@link eddist}(L, R, cost_fn) <= max_dist, but
 * orders of magnitude faster, especially for long strings with small thresholds. The cost function should have a min_cost property, 
 * if it doesn't, it will be assumed to be 0;
 * 
 * Time complexity: O(max_dist/min_cost·|L|)
 * 
 * Space complexity: O(|R|)
 * 
 * Implemented after
 * 		<p style="margin-left: 40px"><i>Marios Hadjieleftheriou and Divesh Srivastava (2011), "Approximate String Processing",</i><br>
 * 		<i>Foundations and Trends® in Databases: Vol. 2: No. 4, pp 267-402</i></p>
 * 
 * <i>Parameters are not checked for validity</i>.
 * 
 * @param {(string|Array.string)} L - a non-empty string/array excluding the {@link GAP}
 * @param {(string|Array.string)} R - a non-empty string/array excluding the {@link GAP}
 * @param {cost-function} cost_fn - an edit cost function with a min_cost property
 * @param {float} max_dist - the non-negative distance threshold 
 * @return {boolean} true if L and R have are at most max_dist apart
 */
export function veddist(L, R, cost_fn, max_dist)
{
    if (L === R) return true;

    const min_cost = cost_fn.min_cost || 0;

    if (abs(L.length - R.length) * min_cost > max_dist) return false;

    const h = L.length + 1,
        v = R.length + 1,
        offset = min_cost === 0 ? inf : floor(max_dist / min_cost), //offset from the lattice's diagonal
        offsetp = offset + 1,
        offsetm = offset - 1;

    prev_col[0] = 0;
    for (let r = 1, end = v < offsetp ? v : offsetp; r < end; r++) //left gap costs for all states, first step
    {
        prev_col[r] = prev_col[r - 1] + cost_fn(ε, R[r - 1]);
    }

    for (let c = 1, dist, end, cmp1, cmp2; c < h; c++)
    {
        curr_col[0] = prev_col[0] + cost_fn(L[c - 1], ε);
        dist = curr_col[0];
        end = v < c + offsetp ? v : c + offsetp;

        for (let r = c - offset > 1 ? c - offset : 1; r < end; r++)
        {
            // this block finds the minimum edit cost
            // it uses a step by step comparision instead of Math.min  for peformance reasons (x4 factor)
            cmp1 = r >= (c - offsetm) ? curr_col[r - 1] + cost_fn(ε, R[r - 1]) : inf; // left gap
            cmp2 = c >= (r - offsetm) ? prev_col[r] + cost_fn(L[c - 1], ε) : inf; // right gap

            if (cmp1 > cmp2) cmp1 = cmp2;

            cmp2 = prev_col[r - 1] + (L[c - 1] === R[r - 1] ? 0 : cost_fn(L[c - 1], R[r - 1])); // substitution

            if (cmp1 > cmp2) cmp1 = cmp2;

            curr_col[r] = cmp1;

            if (dist > cmp1) dist = cmp1;
        }

        if (dist > max_dist) return false;

        swap = prev_col;
        prev_col = curr_col;
        curr_col = swap;
    }

    return prev_col[v - 1] <= max_dist;
}

/**
 * Computes the levenshtein distance between left (L) and right (R) strings/arrays. This is equivalent to, but faster than, 
 * {@link eddist} with {@link LEVENSHTEIN}, i.e., with a cost function giving a weight of 1 for substitutions, deletions and insertions for all symbols;
 * 
 * Time complexity: O(|L|·|R|)
 *
 * Space complexity: O(|R|)
 * 
 *  <i>Parameters are not checked for validity</i>.
 * 
 * @param {(string|Array.string)} L - a non-empty string/array excluding the {@link GAP}
 * @param {(string|Array.string)} R - a non-empty string/array excluding the {@link GAP}
 * @return {int} edit distance in [0, ∞)
 */
export function lev(L, R)
{
    if (L === R) return 0;

    let h = L.length + 1,
        v = R.length + 1;


    for (let c = 0; c < h; c++) //right gap cost for all steps, first state/row
        prev_row[c] = c;

    for (let r = 1, prev, curr, prev_step, tmp; r < v; r++)
    {
        prev = r - 1;
        prev_step = r; //right gap cost for first step, n-th state

        for (let c = 1; c < h; c++)
        {
            curr = prev + (L[c - 1] === R[r - 1] ? 0 : 1);

            tmp = prev_row[c] + 1;

            if (curr > tmp)
            {
                curr = tmp;
            }

            tmp = prev_step + 1;

            if (curr > tmp)
            {
                curr = tmp;
            }

            prev = prev_row[c];
            prev_step = curr;
            prev_row[c] = curr;
        }
    }

    return prev_row[h - 1];
}

/**
 * Verifies that left and right string's leveshtein distance is no greater than the max_dist threshold. It is equivalent to,
 * but faster than {@link veddist}(L, R, {@link LEVENSHTEIN}) 
 * 
 * Time complexity: O(max_dist·|L|)
 * 
 * Space complexity: O(|R|)
 * 
 * Implemented after
 * 		<p style="margin-left: 40px"><i>Marios Hadjieleftheriou and Divesh Srivastava (2011), "Approximate String Processing",</i><br>
 * 		<i>Foundations and Trends® in Databases: Vol. 2: No. 4, pp 267-402</i></p>
 * 
 * <i>Parameters are not checked for validity</i>.
 * 
 * @param {(string|Array.string)} L - a non-empty string/array excluding the {@link GAP}
 * @param {(string|Array.string)} R - a non-empty string/array excluding the {@link GAP}
 * @param {int} max_dist - the non-negative distance threshold
 * @return {boolean} true if L and R have are at most max_dist apart
 */
export function vlev(L, R, max_dist)
{
    if (L === R) return true;

    if (abs(L.length - R.length) > max_dist) return false;

    const 
        h = L.length + 1,
        v = R.length + 1,
        offset = floor(max_dist),
        offsetp = offset + 1,
        offsetm = offset - 1;

    for (let r = 0, end = v < offsetp ? v : offsetp; r < end; r++) //left gap costs for all states, first step
    {
        prev_col[r] = r;
    }

    for (let c = 1, dist, end, cmp1, cmp2; c < h; c++)
    {
        curr_col[0] = c;
        dist = c;
        end = v < c + offsetp ? v : c + offsetp;

        for (let r = (c - offset < 1 ? 1 : c - offset); r < end; r++)
        {
            // this block finds the minimum edit cost
            // it uses a step by step comparision instead of Math.min  for peformance reasons (x4 factor)
            cmp1 = r >= (c - offsetm) ? curr_col[r - 1] + 1 : inf;
            cmp2 = c >= (r - offsetm) ? prev_col[r] + 1 : inf;

            if (cmp1 > cmp2) cmp1 = cmp2;

            cmp2 = prev_col[r - 1] + (L[c - 1] === R[r - 1] ? 0 : 1);

            if (cmp1 > cmp2) cmp1 = cmp2;

            curr_col[r] = cmp1;

            if (dist > cmp1) dist = cmp1;
        }

        if (dist > max_dist) return false;

        swap = prev_col;
        prev_col = curr_col;
        curr_col = swap;
    }

    return prev_col[v - 1] <= max_dist;
}
/**
 * Computes the weighted edit similarity between left (L) and right (R) strings/arrays with the given edit cost function.
 * 
 * Time complexity: O(|L|·|R|)
 * 
 * Space complexity: O(|R|)
 * 
 * <i>Parameters are not checked for validity</i>.
 * 
 * @param {(string|Array.string)} L - a non-empty string/array excluding the {@link GAP}
 * @param {(string|Array.string)} R - a non-empty string/array excluding the {@link GAP}
 * @param {cost-function} cost_fn - an edit cost function with a max_cost property
 * @return {float} edit similarity in [0, 1]
 */
export function edsim(L, R, cost_fn)
{
    return 1 - eddist(L, R, cost_fn) / ((L.length > R.length? L.length : R.length) * (cost_fn.max_cost || 1));
}
/**
 * Verifies that left and right string's weighted edit similarity is at least min_sim threshold. 
 * The weights/costs are given by the cost_fn parameter. 
 * 
 * Time complexity: O(min_sim·max(|L|,|R|)/min_cost·|L|)
 * 
 * Space complexity: O(|R|)
 * 
 * <i>Parameters are not checked for validity</i>.
 * 
 * @param {(string|Array.string)} L - a non-empty string/array excluding the {@link GAP}
 * @param {(string|Array.string)} R - a non-empty string/array excluding the {@link GAP}
 * @param {cost-function} cost_fn - an edit cost function with min_cost and max_cost properties
 * @param {float} min_sim - the similarity threshold in [0, 1]
 * @return {boolean} true if L and R have at least a min_sim similarity
 */
export function vedsim(L, R, cost_fn, min_sim)
{
    const max_dist = (1 - min_sim) * max(L.length > R.length? L.length : R.length) * (cost_fn.max_cost || 1);
    return veddist(L, R, cost_fn, max_dist);
}
/**
 * Computes the British English phonetic similarity between left (L) and right (R) strings/arrays. For words with 
 * more than one pronounciation, the pair with the highest similarity is returned. For words for which 
 * a pronounciation cannot be found, the word itself is used.
 * 
 * The phonetic similarity is based on the weighted edit similarity using a phonetic edit distance cost function.
 * 
 * Time complexity: O(|L|·|R|·|p|²) where p is the maximum number of prounciations for a given word (≈5)
 * 
 * Space complexity: O(|R|)
 * 
 *<i>Parameters are not checked for validity</i>.
 * 
 * @param {(string|Array.string)} L - a non-empty string/array excluding the {@link GAP}
 * @param {(string|Array.string)} R - a non-empty string/array excluding the {@link GAP}
 * @return {float} phonetic similarity in [0, 1]
 */
export function phonesim(L, R)
{
    const
        Lsounds = to_sounds(L),
        Rsounds = to_sounds(R);

    let best_sim = 0;

    for (const Lsound of Lsounds)
    {
        for (const Rsound of Rsounds)
        {
			const sim =edsim(Lsound, Rsound, EN_GB_PHONE);
            best_sim = best_sim > sim ? best_sim : sim;
        }
    }

    return best_sim;
}

/**
 * Verifies that left and right string's phonetic similarity is at least min_sim threshold. For words with 
 * more than one pronounciation, the highest similarity is used.
 * 
 * The phonetic similarity is based on the weighted edit similarity using a phonetic edit distance cost function.

 * Time complexity: O(min_sim·max(|L|,|R|)·|L·|p|²) where p is the maximum number of prounciations for a given word (≈5)
 * 
 * Space complexity: O(|R|)
 * 
 * <i>Parameters are not checked for validity</i>.
 * 
 * @param {(string|Array.string)} L - a non-empty string/array excluding the {@link GAP}
 * @param {(string|Array.string)} R - a non-empty string/array excluding the {@link GAP}
 * @param {float} min_sim - the similarity threshold in [0, 1]
 * @return {boolean} true if L and R have at least a min_sim phonetic similarity
 */
export function vphonesim(L, R, min_sim)
{
    const Rsounds = to_sounds(R);

    for (const Lsound of to_sounds(L))
    {
        for (const Rsound of Rsounds)
        {
            if (vedsim(Lsound, Rsound, EN_GB_PHONE, min_sim))
            {
                return true;
            }
        }
    }

    return false;
}

function to_sounds(word)
{
    const sounds = britfone[word.toUpperCase()];
    return undef(sounds) ? [word] : sounds;
}