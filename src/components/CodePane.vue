<template>
  <div class="codepane">

    <nav class="navbar navbar-expand-md navbar-light bg-light">
      <form class="form-inline">
        <input v-model="branch" class="form-control form-control-sm mr-2" />

        <select class="custom-select custom-select-sm mr-2" v-model="module">
          <option v-for="(data, file) in modules" :value="file">{{file}}</option>
        </select>
      </form>

      <div>
        <button @click.prevent="add()" class="btn btn-sm btn-primary">Add</button>
        <button @click.prevent="remove()" class="btn btn-sm btn-primary">Delete</button>
        <button @click.prevent="load()" class="btn btn-sm btn-primary">Load all</button>
        <button @click.prevent="save()" class="btn btn-sm btn-primary">Save all</button>
      </div>
    </nav>

    <codemirror 
      ref="editor"
      :code="code"
      :options="editorOptions"
      @change="changeCode">
    </codemirror>

    <!-- Add file -->
    <div class="modal show" tabindex="-1" v-if="isAddVisible">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add file</h5>
            <button type="button" class="close" @click="isAddVisible = false">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-group row">
                <label class="col-sm-2 col-form-label">Name</label>
                <div class="col-sm-10">
                  <input type="text" class="form-control" v-model="addName" placeholder="File name">
                </div>
              </div>
            </form>
            <div class="invalid-feedback" v-if="addError">{{addError}}</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="isAddVisible = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addConfirm()">Add</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop show" v-if="isAddVisible"></div>

    </div>
</template>

<script>
import eventBus from '../global-events';
import VueCodemirror from 'vue-codemirror';

export default {
	data() {
		return {
			branch: 'default',
			modules: {},
			module: 'main',
                        isAddVisible: false,
                        addError: '',
                        addName: '',
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
			let {modules} = r;
			if (modules)
				this.modules = modules;
			else
				this.modules = {};
                        if (!this.modules[this.module]) {
                          let files = Object.keys(this.modules);
                          this.module = files[0];
                        }
		},
                add() {
                  this.isAddVisible = true;
                  this.addName = '';
                  this.addError = '';
                },
                addConfirm() {
                  var name = this.addName.trim();
                  if (name === '') {
                    this.addError = 'Invalid name';
                    return;
                  }
                  if (this.modules[name] !== undefined) {
                    this.addError = 'File exists';
                    return;
                  }
                  this.modules[name] = '';
                  this.isAddVisible = false;
                },
                remove() {
                  if (this.module === 'main') {
                    if (this.branch !== 'default') {
                      this.isDeleteBranchVisible = true;
                      return;
                    }
                    return;
                  }
                  var files = Object.keys(this.modules);
                  var index = files.indexOf(this.module);
                  files = files.filter(module => module !== this.module);
                  var newModules = {};
                  files.forEach(module => newModules[module] = this.modules[module]);
                  this.modules = newModules;
                  this.module = files[index === files.length ? index - 1 : index];
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
	}
}
</script>

<style>
.codepane {
  flex: 1 1;
  flex-direction: column;
  min-height: 150px;
}

.codepane .navbar {
  margin-bottom: .25rem;
  margin-top: .25rem;
  padding-bottom: 0;
  padding-top: 0;
}

.codepane .navbar button,
.codepane .navbar input,
.codepane .navbar select {
  margin-bottom: .25rem;
  margin-top: .25rem;
}

.codepane .CodeMirror {
  height: 100%;
  font-size: 12px;
}

.codepane select {
  max-width: 150px;
}
</style>