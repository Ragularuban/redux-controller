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


Package Needs target es2015. this is a common problem with angular


- In Future, redux controllers should support normalised state, for complex arrays. We don't need it now,
- Ideally, there should be an easy way to connect component state to store state! when state is mutated, you could call, component commit.

Change Omiited Paths implementation to the following


    type FullPartial<T> = { [P in keyof T]?: (T[P] extends "object" ? FullPartial<T[P]> : T[P]) }

    omittedPaths: FullPartial<AnalyticsCache> = {
        analytics: {
            "*": {
                instagram: null,
                facebook: null,
                lastUpdated: null
            }
        },
    }

Also could create a normalized Provider, which would load array and convert to keys . In this way, the whole list can be loaded as well as sub objects


Provider could have the following fields
items Being loaded
error in fetching items


# Access to RootStore from ReduxAction


Need to add notes for es6

Need to remove JSX

Add Enhancers - This will help to manage UI Components and callbacks,
May be this approch - Trigger an action that changes the state, without the function
and at the end of this another action is triggered, which you can listen to
Or May be
Have a subscription Method for Actions to listen to all the actions of that type


- Need to remove JSX
- Normalised Redux State
- preferred interface UserController.get().load();
-- Tried to do it, but, feel like it's impossible as it hard to get the typings, method is already there, but hard to get typings
- Automatic action names should consider Class name as well to prevent similar actions getting triggered
- Use async draft  - https://github.com/mweststrate/immer
--- async draft is there, but if we are to implement need to think draft registry or commit registry to keep track of changes, --- tried to implement it without minimal changes, but seems impossible without registry
- what if we convert all methods to static that you don't need to worry about singletons