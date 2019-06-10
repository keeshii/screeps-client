<template>
  <div class="codepane">

    <nav class="navbar navbar-expand-md navbar-light bg-light">
      <form class="form-inline">
        <input v-model="branch" class="form-control form-control-sm mr-2" />

        <input v-model="module" class="form-control form-control-sm mr-2" />

        <vue-select class="module-select" v-model="module" :options="moduleNames">
        </vue-select>
      </form>

      <div>
        <button @click.prevent="load()" class="btn btn-sm btn-primary">Load</button>
        <button @click.prevent="save()" class="btn btn-sm btn-primary">Save</button>
      </div>
    </nav>

    <codemirror 
      ref="editor"
      :code="code"
      :options="editorOptions"
      @change="changeCode">
    </codemirror>

  </div>
</template>

<script>
import eventBus from '../global-events';
import VueCodemirror from 'vue-codemirror';
import VueSelect from 'vue-select';

export default {
	data() {
		return {
			branch: 'default',
			modules: {},
			module: 'main',
			editorOptions: {
				theme: 'monokai',
				lineNumbers: true,
				line: true,

				// keyMap: "sublime",
				foldGutter: true,
				gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],

				styleSelectedText: true,
				highlightSelectionMatches: {showToken: /\w/, annotateScrollbar: true}
			}
		}
	},
	mounted() {
		if (eventBus.api)
			this.load();
		else
			this.$watch(function() { return eventBus.api }, api => {
				console.log('api', api);
				if (eventBus.api)
					setTimeout( () => this.load(), 1000);
			})
	},
	computed: {
		code() {
			return this.modules[this.module] || '';
		},
		moduleNames() {
			return Object.keys(this.modules);
		}
	},
	methods: {
		async load() {
			let r = await eventBus.api.code(this.branch);
			console.log('code', r);
			let {modules} = r;
			if (modules)
				this.modules = modules;
			else
				this.modules = {};
		},
		save() {
			eventBus.api.setCode(this.branch, this.modules);
		},
		changeCode(newCode) {
			if (!this.modules[this.module] && newCode === '')
				return;
			
			this.$set(this.modules, this.module, newCode);
		}
	},
	components: {
		codemirror: VueCodemirror.codemirror,
		VueSelect,
	}
}
</script>

<style>
.codepane {
  flex: 1 1;
  flex-direction: column;
}

.codepane .navbar {
  justify-content: space-between;
}

.codepane .CodeMirror {
  height: 100%;
  font-size: 12px;
}

.module-select {
  max-width: 50%;
  display: inline-block;
}
</style>