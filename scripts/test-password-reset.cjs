// No real emails, accounts or database writes: exercise the reset service with an in-memory repository.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict'),ts=require('typescript'),bcrypt=require('bcryptjs');
process.env.PASSWORD_RESET_SECRET='test-only-secret-not-for-deployment';
process.env.EMAILJS_SERVICE_ID='test';process.env.EMAILJS_TEMPLATE_ID='test';process.env.EMAILJS_PUBLIC_KEY='test';
const rows=new Map(),limits=new Map(),emails=[];
let user={_id:'test-user',name:'Test User',email:'otp-test@example.invalid',passwordHash:'old-hash',sessionVersion:0};
const match=(row,q)=>Object.entries(q).every(([k,v])=>v && typeof v==='object' && !(v instanceof Date)?Object.entries(v).every(([op,n])=>op==='$gt'?row[k]>n:op==='$lt'?row[k]<n:false):row[k]===v);
const update=(row,u)=>{Object.assign(row,u.$set||{});for(const [k,n]of Object.entries(u.$inc||{}))row[k]=(row[k]||0)+n;for(const k of Object.keys(u.$unset||{}))delete row[k];return row;};
function repository(map){return {
 async findOneAndUpdate(q,u,opts={}){let row=[...map.values()].find(x=>match(x,q));if(!row && opts.upsert){if(map.has(q._id))throw Object.assign(new Error('duplicate'),{code:11000});row={_id:q._id,...u.$setOnInsert};map.set(q._id,row);}return row?{...update(row,u)}:null;},
 async updateOne(q,u){const row=[...map.values()].find(x=>match(x,q));if(row)update(row,u);return {modifiedCount:row?1:0};},
 async exists(q){return [...map.values()].some(x=>match(x,q));}
};}
const User={findOne(q){return {select(){return {lean:async()=>q.email===user.email?{...user}:null}}}},async updateOne(q,u){if(!match(user,q))return {modifiedCount:0};update(user,u);return {modifiedCount:1};}};
const file=path.resolve('src/lib/passwordReset.ts');const mod=new Module(file);mod.paths=module.paths;const base=mod.require.bind(mod);
mod.require=id=>id==='server-only'?{}:id==='@/lib/mongodb'?{connectDB:async()=>{}}:id==='@/models'?{User}:id==='@/models/PasswordReset'?{PasswordReset:repository(rows),PasswordResetLimit:repository(limits)}:id==='@/lib/resetEmail'?{sendResetEmail:async(email,name,otp,language)=>emails.push({email,otp,language})}:base(id);
mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,file);
const api=mod.exports;
const rejects=async(fn,code)=>assert.rejects(fn,e=>e.code===code);
(async()=>{
 await rejects(()=>api.requestPasswordReset('invalid','vi'),'INVALID_EMAIL');
 let {challenge}=await api.requestPasswordReset(user.email,'en');assert.equal(emails[0].language,'en');assert.match(emails[0].otp,/^\d{6}$/);assert.ok(!JSON.stringify([...rows.values()]).includes(emails[0].otp));
 await rejects(()=>api.requestPasswordReset(user.email,'en'),'RATE_LIMITED');
 await rejects(()=>api.finishPasswordReset(challenge,'NewPassword123'),'RESET_EXPIRED');
 const wrong=emails[0].otp==='000000'?'111111':'000000';
 await rejects(()=>api.verifyResetOtp(challenge,wrong),'INVALID_OTP');
 const grant=await api.verifyResetOtp(challenge,emails[0].otp);assert.equal(await api.hasResetGrant(grant),true);assert.equal(await api.hasResetGrant(challenge),false);
 await rejects(()=>api.verifyResetOtp(challenge,emails[0].otp),'OTP_EXPIRED');
 await rejects(()=>api.finishPasswordReset(grant,'short'),'WEAK_PASSWORD');
 await api.finishPasswordReset(grant,'NewPassword123');assert.equal(await bcrypt.compare('NewPassword123',user.passwordHash),true);assert.equal(user.sessionVersion,1);assert.equal(await api.hasResetGrant(grant),false);
 await rejects(()=>api.finishPasswordReset(grant,'OtherPassword123'),'RESET_EXPIRED');
 rows.clear();limits.clear();emails.length=0;
 ({challenge}=await api.requestPasswordReset(user.email,'vi'));
 const wrong2=emails[0].otp==='000000'?'111111':'000000';
 for(let i=1;i<=5;i++)await rejects(()=>api.verifyResetOtp(challenge,wrong2),i===5?'OTP_EXPIRED':'INVALID_OTP');
 await rejects(()=>api.verifyResetOtp(challenge,emails[0].otp),'OTP_EXPIRED');
 rows.clear();limits.clear();emails.length=0;
 ({challenge}=await api.requestPasswordReset(user.email,'vi'));for(const row of rows.values())row.expiresAt=new Date(0);
 await rejects(()=>api.verifyResetOtp(challenge,emails[0].otp),'OTP_EXPIRED');
 rows.clear();limits.clear();emails.length=0;
 ({challenge}=await api.requestPasswordReset('unknown@example.invalid','vi'));assert.equal(emails.length,0);assert.equal(typeof challenge,'string');await rejects(()=>api.verifyResetOtp(challenge,'123456'),'INVALID_OTP');
 rows.clear();limits.clear();emails.length=0;
 ({challenge}=await api.requestPasswordReset(user.email,'vi'));const original=challenge;limits.clear();({challenge}=await api.requestPasswordReset(user.email,'vi'));await rejects(()=>api.verifyResetOtp(original,emails[0].otp),'OTP_EXPIRED');
 const grant2=await api.verifyResetOtp(challenge,emails[1].otp);for(const row of rows.values())row.grantExpiresAt=new Date(0);await rejects(()=>api.finishPasswordReset(grant2,'NewPassword123'),'RESET_EXPIRED');
 assert.equal(api.validNewPassword('ắ'.repeat(25)+'Ab1'),false);
 console.log('PASS: validation, hashed OTP, throttling, wrong/expired/reused OTP, five-attempt lockout, resend invalidation, grant expiry, password hashing, session invalidation, unknown email privacy. No real data changed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
