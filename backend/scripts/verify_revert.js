const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (path) {
    if (path.includes('config/db')) {
        return {
            from: () => ({
                select: () => ({ eq: () => ({ single: () => ({}), maybeSingle: () => ({}) }) }),
                insert: () => ({ select: () => ({ single: () => ({}) }) }),
                update: () => ({ eq: () => ({ select: () => ({ single: () => ({}) }) }) }),
                delete: () => ({ eq: () => ({}) }),
                rpc: () => ({})
            })
        };
    }
    return originalRequire.apply(this, arguments);
};

try {
    console.log("Loading slotController...");
    require('../controllers/slotController');
    console.log("✅ slotController loaded successfully");

    console.log("Loading paymentController...");
    require('../controllers/paymentController');
    console.log("✅ paymentController loaded successfully");

    console.log("Loading slotRoutes...");
    require('../routes/slotRoutes');
    console.log("✅ slotRoutes loaded successfully");

    console.log("All modified files passed syntax check.");
} catch (err) {
    console.error("❌ Syntax Error or Load Error:", err);
    process.exit(1);
}
