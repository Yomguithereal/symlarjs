'use strict';
const {describe, it} = require('mocha');
const {should} = require('chai').should();
const {check, gen} = require('mocha-testcheck');
const {lev, vlev, eddist, veddist, edsim, vedsim, phonesim, vphonesim, LEVENSHTEIN, GAP} = require('./symlar');

const {assign} = Object, {abs, min, max} = Math;
const opts = {numTests: 1000, seed: 42}, DELTA = 1e-5; //allows for error in floating point computations

describe('eddist', _ =>
{ 
    it('deals with substitutions correctly',   check(
            opts,//the lines below ensure that there are never matches between the two strings
            gen.alphaNumString.then(s => s.replace(/[0-9]/g, 'a').toLowerCase()).suchThat(s => !s.includes(GAP)),
            gen.alphaNumString.then(s => s.replace(/[0-9]/g, 'A').toUpperCase()).suchThat(s => !s.includes(GAP)),
            gen.numberWithin(0, 1),
            gen.numberWithin(0, 1),
            (left, right, left_gap, right_gap) => 
            {
                const   short_L= min(left.length, right.length),
                        subs = .5*min(left_gap, right_gap),//ensures substitutions are chosen over insertions/deletions
                        expected_dist = short_L*subs;

                eddist(left.slice(0,short_L), right.slice(0,short_L), cost_fn_from(left_gap, right_gap, subs))
                    .should.be.closeTo(expected_dist, DELTA);
            }
    ));

    it('deals with insertions/deletions correctly', check(
        opts,
        gen.alphaNumString.suchThat(s => !s.includes(GAP)),
        gen.numberWithin(0, 1),
        gen.numberWithin(0, 1),
        (left, left_gap, right_gap) => 
        {
            const   right = left.replace(/[0-9]/g,''),
                    short_L = min(left.length, right.length),
                    diff = abs(left.length-right.length), 
                    subs = .5*min(left_gap, right_gap),
                    gap = short_L === left.length? left_gap : right_gap,
                    expected_dist = (diff*gap);
       
            eddist(left, right, cost_fn_from(left_gap, right_gap, subs)).should.be.closeTo(expected_dist, DELTA);
        }));  
        
    it('computes levenshtein distance correctly',   check(
        opts,
        gen.alphaNumString.notEmpty().suchThat(s => !s.includes(GAP)) ,
        gen.alphaNumString.notEmpty().suchThat(s => !s.includes(GAP)) ,
        (left, right ) => 
        {
            eddist(left, right, LEVENSHTEIN).should.be.eql(lev(left, right));
        }
    ));
});

describe('lev', _ =>
{ 
    it('deals with substitutions correctly',   check(
            opts,//the lines below ensure that there are never matches between the two strings
            gen.alphaNumString.then(s => s.replace(/[0-9]/g, 'a').toLowerCase()).suchThat(s => !s.includes(GAP)),
            gen.alphaNumString.then(s => s.replace(/[0-9]/g, 'A').toUpperCase()).suchThat(s => !s.includes(GAP)),
            (left, right ) => 
            {
                const   short_L= min(left.length, right.length), subs = 1, 
                        expected_dist = short_L*subs;

                lev(left.slice(0,short_L), right.slice(0,short_L)).should.be.closeTo(expected_dist, DELTA);
            }
    ));

    it('deals with insertions/deletions correctly', check(
        opts,
        gen.alphaNumString.suchThat(s => !s.includes(GAP)), 
        left => 
        {
            const   right = left.replace(/[0-9]/g,''),
                    short_L = min(left.length, right.length),
                    diff = abs(left.length-right.length), 
                    subs = 1,
                    gap = 1,
                    expected_dist = (diff*gap);
       
            lev(left, right).should.be.closeTo(expected_dist, DELTA);
        }));    
        
});

describe('veddist', _ =>
{   
    it('verifies distance between strings is no larger than given max distance', check(
        opts,
        gen.string.notEmpty().suchThat(s => !s.includes(GAP)),
        gen.string.notEmpty().suchThat(s => !s.includes(GAP)),
        gen.numberWithin(0, 1e6).then(n => n < 1e-40 ? 0 : n),
        gen.numberWithin(0, 1e6).then(n => n < 1e-40 ? 0 : n),
        gen.numberWithin(0, 1e6).then(n => n < 1e-40 ? 0 : n),
        gen.posNumber,
        (left, right, left_gap, right_gap, subs, max_dist) => 
        {
            const   cost_fn = cost_fn_from(left_gap, right_gap, subs);
             
            veddist(left, right, cost_fn, max_dist).should.eql(eddist(left, right, cost_fn) <= max_dist);
        }));
});

describe('vlev', _ =>
{   
    it('verifies distance between strings is no larger than given max distance', check(
        opts,
        gen.string.notEmpty().suchThat(s => !s.includes(GAP)),
        gen.string.notEmpty().suchThat(s => !s.includes(GAP)),
        gen.posNumber,
        (left, right, max_dist) => 
        {
            vlev(left, right, max_dist).should.eql(veddist(left, right, LEVENSHTEIN, max_dist));
        }));
});

describe('vedsim', _ =>
{   
    it('verifies similarity between strings is at least the one passed in', check(
        opts,
        gen.string.notEmpty().suchThat(s => !s.includes(GAP)),
        gen.string.notEmpty().suchThat(s => !s.includes(GAP)),
        gen.numberWithin(0, 1e6).then(n => n < 1e-15 ? 0 : n),
        gen.numberWithin(0, 1e6).then(n => n < 1e-15 ? 0 : n),
        gen.numberWithin(0, 1e6).then(n => n < 1e-15 ? 0 : n),
        gen.numberWithin(0, 1),
        (left, right, left_gap, right_gap, subs, eq, min_sim) => 
        {
            const   cost_fn = cost_fn_from(left_gap, right_gap, subs),
                    min_cost = min(left_gap, right_gap, subs, eq),
                    max_cost = max(left_gap, right_gap, subs, eq);
            
            vedsim(left, right, cost_fn, min_sim).should.eql(edsim(left, right, cost_fn) >= min_sim);
        }));
});
 
describe('vphonesim', _ =>
{ 
     it('verifies phonetic similarity between strings is at least the one passed in', check(
        opts,
        gen.string.notEmpty().suchThat(s => !s.includes(GAP)),
        gen.string.notEmpty().suchThat(s => !s.includes(GAP)),            
        gen.numberWithin(0, 1),
        (left, right, min_sim) => 
        {
            vphonesim(left, right, min_sim).should.eql(phonesim(left, right) >= min_sim);
        }));
});

function cost_fn_from(left_gap, right_gap, subs)
{
    function fn(left, right) 
    {         
        return  left === right ? 0:                            
                left === GAP ? left_gap:
                right === GAP ? right_gap:                            
                subs; 
    }

    fn.min_cost = min(left_gap, right_gap, subs);
    fn.max_cost = max(left_gap, right_gap, subs);

    return fn;
}