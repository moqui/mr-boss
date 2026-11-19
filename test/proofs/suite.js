// BOSS's security proofs (moqui test-client mr-boss --proofs), filed by OWASP ASVS 5.0.0 requirement: the rows of
// docs/ASVS-Matrix.md whose status is BOSS and that a client can show. With --serve they run against the server
// test/client runs against (mr-boss on the dev conf, its mail kept in the capture), with the demo data and ProofFixtures'
// users and calendar link; against any other server in the deployment profile, where a proof that needs an account takes
// --param user=NAME (its password in MOQUI_TEST_PASSWORD), one that writes on a record takes --param requestId=ID (a
// request the account may add notes and files to; the proof removes what it adds), the masking proofs open a link with a
// password named by --param shareToken=TOKEN and --param calendarToken=TOKEN, and one that needs fixture data skips;
// 6.3.2 (the demo accounts) runs only there. matrix is the matrix the run's summary (proofs.json, proofs.md) joins its
// results to, relative to this component's directory. V7SessionManagement adds a second factor and signs sessions out, so
// it runs last.
suite(['V3WebFrontend', 'V5FileHandling', 'V6Authentication', 'V15SecureCoding', 'V7SessionManagement'], {
    server: {
        components: ['mr-boss'],
        specs: ['ProofFixtures'],
        conf: 'conf/MoquiDevConf.xml',
        // as test/client's server: mail a proof's action sends stays in the capture (docs/Build-Test.md)
        properties: { moqui_conf__email_client__capture_sends: 'true' },
    },
    matrix: 'docs/ASVS-Matrix.md',
})
