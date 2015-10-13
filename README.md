# Declarative style JSON objects converter

## Features

* Self descriptive template language
* Simple syntax for flattening hierarchical objects
* Possibility to mix declarative and imperative styles

## Install

`npm install t-objects`

## Usage example

```
var T = require('t-objects');

var company = {
	Departments: [
		{
			Name: 'Quality assurance',
			Staff: [
				{
					FirstName: 'Panic',
                    LastName: 'Generator',
                    Position: 'QA-Engineer'
				},
				{
					FirstName: 'Ivanov',
                    LastName: 'Ivan',
                    Position: 'QA-Engineer'
				}
			]
		},
		{
			Name: 'Development',
			Staff: [
				{
					FirstName: 'Bydlo',
                    LastName: 'Coder',
                    Position: 'Junior Developer'
				},
				{
					FirstName: 'Nebydlo',
                    LastName: 'Coder',
                    Position: 'Senior Developer'
				}
			]
		}
	]
};

var t = T({
	'->': true,
	$company: ':external',
	'{$dep}': [ '$company', function(c){ return c.Departments }],
	'{$person}': [ '$dep', function(d){ return d.Staff }],
    FirstName: [ '$person', function(p){ return p.FirstName }],
    LastName: [ '$person', function(p){ return p.LastName }],
    Position: [ '$person', function(p){ return p.Position }],
    Department: [ '$dep', function(d){ return d.Name }]
});

console.log(t.build({ $company: company }));

```

### Output

```
[
	{
		FirstName: 'Panic',
		LastName: 'Generator',
		Position: 'QA-Engineer',
        Department: 'Quality assurance'
    },
	{
		FirstName: 'Ivanov',
		LastName: 'Ivan',
		Position: 'QA-Engineer',
        Department: 'Quality assurance'
    },
	{
		FirstName: 'Bydlo',
		LastName: 'Coder',
		Position: 'Junior Developer',
        Department: 'Development'
    },
	{
		FirstName: 'Nebydlo',
		LastName: 'Coder',
		Position: 'Senior Developer',
        Department: 'Development'
    }
]
```

### The same template in ECMA 6

```
template = T({
	'->': true,
	$company: ':external',
	'{$dep}': [ '$company', c => c.Departments ],
	'{$person}': [ '$dep', d => d.Staff ],
    FirstName: [ '$person', p => p.FirstName ],
    LastName: [ '$person', p => p.LastName ],
    Position: [ '$person', p => p.Position ],
    Department: [ '$dep', d => d.Name ]
});
```


## API reference

### `T Class`

### Constructor

**Params**
* template `Object` Template object

**Returns** `T` Class instance


### build

**Params**
* data `Object` Input data object

**Returns** `Object` Output data object


## Language reference

### Special keys

* `->` **Template marker or initial queue.** Any object in template that has this marker will be processed by `build` method. Marker may be set in `boolean` `true` value or predefined keys queue. Predefined keys queue will be corrected or appended by properties dependencies.


* `$<string>` **Service property.** These properties may be used as temporary variables and will be deleted at the end of processing.


* `?` **Condition.** If this property is falsy parent object will be rejected from output data object.


* `{<value>,<index>,<total index>}` **Variety.** Property constructor must return `array` of values for this key. In this case parent object will be expanded in collection of objects. Every element of this collection will be parent object extended by new `<value>`, its `<index>` and `<total index>` (if parent has already become a collection).


* `$return` **Replace object with this property.** Replaces parent object with this property.


* `:` **Key of object.** Replaces array for multiinstance object.


* `$parent` **Parent object.** 


* `$root` **Root object.**

### Special values

* `:external` **Find value of this key in input data.**


* `[ 'key1', 'key2', ... keyN, function(key1, key2, ... keyN){ ... }]` **Property constructor.** `'key1', 'key2', ... keyN` - dependencies. This notation also works in singular forms: `[function(){...}]` and `function(){...}`

### Property constructor notation

* `[ 'key1', 'key2', ... 'keyN', function(key1, key2, ... keyN){ ... }]` **Property constructor.** 

	`'key1', 'key2', ... 'keyN'` - dependencies. One may mark dependency as mandatory or critical.
    
    * `'key*'` - mandatory. In this case, if value of `key` is undefined, constructor will not be called.
    * `'key**'` - critical. In this case, if value of `key` is undefined, `build_error` exception will be thrown.
    
    This notation also works in singular forms: `[function(){...}]` and `function(){...}`
