13) Todo: Check async and sync function in redux controllers
15) Probably Could provide out of the box CRUD
// - delete(state=>state.fsdf3.4324)
// - update(4234234=>state.sgf.422)
// - Get() == Already done with provide with key

// Actually, without passing the controllers to the init function, we could init them from the controllers registry created by the decorater


preferred interface UserController.get().load();
Automatic action names should consider Class name as well to prevent similar actions getting triggered


Could Think about passing the a proxy to this context, that returns the draft when calling state, this would work for sync.
for async, probably could come across something that that keeps track of all mutation in the draft one by one (like reduced states) and then commit together at the end of the function