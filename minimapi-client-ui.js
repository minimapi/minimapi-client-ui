class MinimAPI_UI {
	constructor(api_client, data_type, table_id, filters={}, special_types=[]){
		this.api = api_client
		this.data_type = data_type
		this.table_id = table_id
		this.table = document.getElementById(table_id)
		this.filters = filters
		this.prepare_table()
		this.load_header()
		this.special_types = {}
		for(let type of special_types){
			this.special_types[type.name] = type
		}
	}

	prepare_table(){
		this.table.className = 'minimapi_client_ui'

		let thead = document.createElement('thead')
		let header_row = document.createElement('tr')
		header_row.id = this.table_id+'_header_row'
		thead.appendChild(header_row)

		let tbody = document.createElement('tbody')
		tbody.id = this.table_id+'_data_table'
		let form_row = document.createElement('tr')
		form_row.id = this.table_id+'_form_row'
		tbody.appendChild(form_row)

		this.table.appendChild(thead)
		this.table.appendChild(tbody)

		this.data_table = document.getElementById(this.table_id+'_data_table')
		this.header_row = document.getElementById(this.table_id+'_header_row')
		this.form_row = document.getElementById(this.table_id+'_form_row')	

		if(!document.getElementById(this.table_id+'_minimapi_ui_form')){
			let form = document.createElement('form')
			form.id = this.table_id+'_minimapi_ui_form'
			document.body.appendChild(form)
		}
	}

	load_header(){
		this.header_row.innerHTML = ''
		this.form_row.innerHTML = ''
		for(const property in this.api.model[this.data_type]){
			var header_element = document.createElement('th')
			header_element.innerHTML = property
			this.header_row.appendChild(header_element)

			var cell = document.createElement('td')

			if(this.api.model[this.data_type][property].type == 'foreign'){
				var input = document.createElement('select')
				this.api.list(property).then((result) => this.insert_options(result, property))
			}else{
				var input = document.createElement('input')
				input.placeholder = property
				input.type = this.api.model[this.data_type][property].type
				if(property in this.filters){
					input.value = this.filters[property]
				}
				input.setAttribute('size',property.length);
			}
			input.name = property
			input.setAttribute('form', this.table_id+'_minimapi_ui_form')
			cell.appendChild(input)
			this.form_row.appendChild(cell)
		}

		this.header_row.appendChild(document.createElement('th'))

		var cell = document.createElement('td')
		var button = document.createElement('input')
		button.type = 'button'
		button.value = 'search'
		button.setAttribute('form', this.table_id+'_minimapi_ui_form')
		button.onclick = event => {
			this.send_form('search', event.target.form)
		}
		cell.appendChild(button)
		var button = document.createElement('input')
		button.type = 'button'
		button.value = 'create'
		button.setAttribute('form', this.table_id+'_minimapi_ui_form')
		button.onclick = event => {
			this.send_form('create', event.target.form)
		}
		cell.appendChild(button)

		this.form_row.appendChild(cell)

		this.api.search(this.data_type, this.filters).then((result) => this.load_data(result))
	}

	load_data(result){
		while(this.data_table.lastChild.id !== this.table_id+'_form_row'){
			this.data_table.removeChild(this.data_table.lastChild)
		}

		for(const element of result){
			var new_row = document.createElement('tr')
			for(const property in this.api.model[this.data_type]){
				var new_cell = document.createElement('td')
				new_cell.dataset.id = element['id']
				new_cell.dataset.name = property
				let value = element[property]
				let property_type = this.api.model[this.data_type][property]['type']
				if(property_type in this.special_types){
					value = this.special_types[property_type].show(value)
				}
				new_cell.innerHTML = (typeof(value) != 'string' || value.length <= 25)?value:value.slice(0,25)+'...'
				new_cell.dataset.data = element[property]
				if(property_type == 'foreign'){
					new_cell.dataset.foreign = element[property]
					new_cell.dataset.show = this.api.model[this.data_type][property]['show']
				}
				new_cell.onclick = async event => {
					let clipboard = ''
					if(this.api.model[this.data_type][property].tags.includes('unlistable')){
						clipboard = await this.retrieve(event.target)
					}else{
						clipboard = event.target.dataset.data
					}
					if(property_type in this.special_types){
						clipboard = await this.special_types[property_type].click(clipboard)
					}
					this.clipboard(clipboard)
				}
				new_cell.ondblclick = event => {
					if(this.api.model[this.data_type][property].tags.includes('unlistable')){
						this.retrieve(event.target).then((result) => {
							event.target.innerHTML = result
							this.edit(event.target)
						})
					}else{
						this.edit(event.target)
					}
				}
				new_row.appendChild(new_cell)
			}
			var new_cell = document.createElement('td')
			new_cell.innerHTML = 'X'
			new_cell.className = 'cross'
			new_cell.onclick = event => {
				this.click_delete(event.target, this.data_type, element['id'])
			}
			new_row.appendChild(new_cell)
			this.data_table.appendChild(new_row)
		}
		this.show_foreigns()
	}

	insert_options(result, data_type){
		var select = document.getElementsByName(data_type)[0]
		select.appendChild(document.createElement('option'))
		for(const element of result){
			var option = document.createElement('option')
			option.value = element['id']
			option.innerHTML = element[this.api.model[this.data_type][data_type]['show']]
			select.appendChild(option)
		}
		if(data_type in this.filters){
			select.value = this.filters[data_type]
		}
	}

	show_foreigns(){
		for(const property in this.api.model[this.data_type]){
			if(this.api.model[this.data_type][property].type == 'foreign'){
				var select = document.getElementsByName(property)[0]
				Array.from(select.options).forEach(function(option) {
					var cells = document.querySelectorAll("[data-foreign='"+option.value+"']")
					cells.forEach(function(cell) {
						cell.innerHTML = option.innerHTML
					})
				})
			}
		}
	}

	send_form(action, form){
		event.preventDefault()
		var form_data = {}
		for(var input = 0;input < form.length;input++){
			if(form[input].name && form[input].value){
				form_data[form[input].name] = form[input].valueAsNumber || form[input].value
			}
		}
		switch(action){
			case 'create': this.api.create(this.data_type, form_data).then((result) => this.load_header(result));break;
			case 'search': this.api.search(this.data_type, form_data).then((result) => this.load_data(result));break;
		}
	}

	retrieve(element){
		if(document.getElementById("edited")){
			return
		}
		return this.api.read(this.data_type, element.dataset.id).then((result) => {
			return result[0][element.dataset.name]
		})
	}

	clipboard(data){
		navigator.clipboard.writeText(data)
	}

	edit(element){
		if(document.getElementById("edited")){
			return
		}

		var current_value = element.innerHTML

		var new_input = document.getElementsByName(element.dataset.name)[0].cloneNode(true)
		if(new_input.tagName == 'SELECT'){
			new_input.selected = element.dataset.foreign
		}else{
			new_input.value = current_value
		}
		new_input.id = 'edited_input'

		element.innerHTML = ''
		element.append(new_input)

		element.id = "edited"
		element.setAttribute("data-previous", current_value)

		new_input.focus()

		document.onkeydown = event => {
			this.check_edition(event)
		}
	}

	check_edition(event){
		if(event.keyCode === 13 || event.keyCode === 27){//enter or echap
			event.preventDefault()
			document.onkeydown = null
			var element = document.getElementById("edited")
			if(!element){
				return
			}
			if(event.keyCode === 13){//enter
				var data = {'id':element.dataset.id}
				var input = document.getElementById('edited_input')
				data[element.dataset.name] = input.valueAsNumber || input.value
				this.api.update(this.data_type, element.dataset.id, data).then((result) => this.end_edit(result))
			}else if(event.keyCode === 27){//echap
				this.end_edit(null)
			}
		}
	}

	end_edit(result){
		var element = document.getElementById("edited")
		if(!element){
			return
		}
		if(result && element.dataset.name != 'password'){
			var edited_input = document.getElementById('edited_input')
			if(edited_input.options){
				var value = edited_input.options[edited_input.selectedIndex].text
			}else{
				var value = edited_input.value
			}
			element.innerHTML = value
		}else{
			element.innerHTML = element.dataset.previous
		}
		if(this.api.model[this.data_type][element.dataset.name].tags.includes('unlistable')){
			element.innerHTML = '-'
		}
		element.removeAttribute("data-previous")
		element.id = ''
	}

	click_delete(element, type,id){
		if(confirm('Confirm ?')){
			this.api.del(type, id).then((result) => element.parentNode.remove())
		}
	}
}