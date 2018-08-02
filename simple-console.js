
var SimpleConsole = function(options) {

	if (!options.handleCommand && !options.outputOnly) {
		throw new Error("You must specify either options.handleCommand(input) or options.outputOnly");
	}

	var output_only = options.outputOnly;
	var handle_command = options.handleCommand;
	var placeholder = options.placeholder || "";
	var autofocus = options.autofocus;
	var storage_id = options.storageID || "simple-console";

	var add_svg = function(to_element, icon_class_name, svg, viewBox = "0 0 16 16") {
		var icon = document.createElement("span");
		icon.className = icon_class_name;
		icon.innerHTML = '<svg width="1em" height="1em" viewBox="' + viewBox + '">' + svg + '</svg>';
		to_element.insertBefore(icon, to_element.firstChild);
	};

	var add_chevron = function(to_element) {
		add_svg(to_element, "input-chevron",
			'<path d="M6,4L10,8L6,12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>'
		);
	};


	var console_element = document.createElement("div");
	console_element.className = "simple-console";

	var output = document.createElement("div");
	output.className = "simple-console-output";
	output.setAttribute("role", "log");
	output.setAttribute("aria-live", "polite");

	var input_wrapper = document.createElement("div");
	input_wrapper.className = "simple-console-input-wrapper";
	add_chevron(input_wrapper);

	var input = document.createElement("textarea");
	input.className = "simple-console-input";
	input.setAttribute("id", "inputTextarea");
	input.setAttribute("autofocus", "autofocus");
	input.setAttribute("placeholder", placeholder);
	input.setAttribute("aria-label", placeholder);

	console_element.appendChild(output);
	if(!output_only){
		console_element.appendChild(input_wrapper);
	}
	input_wrapper.appendChild(input);

	var clear = function() {
		output.innerHTML = "";
	};

	var last_entry;
	var get_last_entry = function(){
		return last_entry;
	};

	var log = function(content) {
		var was_scrolled_to_bottom = output.is_scrolled_to_bottom();

		var entry = document.createElement("div");
		entry.className = "entry";
		if (content instanceof Element) {
			entry.appendChild(content);
		} else {
			entry.innerText = entry.textContent = content;
		}
		output.appendChild(entry);

		requestAnimationFrame(function() {
			if (was_scrolled_to_bottom) {
				output.scroll_to_bottom();
			}
		});

		last_entry = entry;
		return entry;
	};

	var logHTML = function(html) {
		log("");
		get_last_entry().innerHTML = html;
	};

	var error = function(content) {
		log(content);
		get_last_entry().classList.add("error");
	};

	var warn = function(content) {
		log(content);
		get_last_entry().classList.add("warning");
	};

	var info = function(content) {
		log(content);
		get_last_entry().classList.add("info");
	};

	var success = function(content) {
		log(content);
		get_last_entry().classList.add("success");
	};

	output.is_scrolled_to_bottom = function() {
		// 1px margin of error needed in case the user is zoomed in
		return output.scrollTop + output.clientHeight + 1 >= output.scrollHeight;
	};

	output.scroll_to_bottom = function() {
		output.scrollTop = output.scrollHeight;
	};

	var command_history = [];
	var command_index = command_history.length;
	var command_history_key = storage_id + " command history";

	var load_command_history = function() {
		try {
			command_history = JSON.parse(localStorage[command_history_key]);
			command_index = command_history.length;
		} catch (e) {}
	};

	var save_command_history = function() {
		try {
			localStorage[command_history_key] = JSON.stringify(command_history);
		} catch (e) {}
	};

	var clear_command_history = function() {
		command_history = [];
		save_command_history();
	};

	load_command_history();

	var emptyInputAndSizeItToOneLineOnly = function() {
		setTimeout(function(){ input.value = ""; autosize.update(input); console.log("input");});
	};

	input.addEventListener("keydown", function(e) {
		if (e.keyCode === 13) { // Enter

			var command = input.value;
			if (command === "") {
				emptyInputAndSizeItToOneLineOnly();
				return;
			}

			if (command_history[command_history.length - 1] !== command) {
				command_history.push(command);
			}
			command_index = command_history.length;
			save_command_history();

			var command_entry = log(command);
			command_entry.classList.add("input");
			add_chevron(command_entry);

			output.scroll_to_bottom();

			handle_command(command);
			emptyInputAndSizeItToOneLineOnly();

		} else if (e.keyCode === 38) { // Up
			
			if (--command_index < 0) {
				command_index = -1;
				input.value = "";
			} else {
				input.value = command_history[command_index];
			}
			input.setSelectionRange(input.value.length, input.value.length);
			e.preventDefault();
			
			autosize.update(input);
			
		} else if (e.keyCode === 40) { // Down
			
			if (++command_index >= command_history.length) {
				command_index = command_history.length;
				input.value = "";
			} else {
				input.value = command_history[command_index];
			}
			input.setSelectionRange(input.value.length, input.value.length);
			e.preventDefault();
			
		} else if (e.keyCode === 46 && e.shiftKey) { // Shift+Delete
			
			if (input.value === command_history[command_index]) {
				command_history.splice(command_index, 1);
				command_index = Math.max(0, command_index - 1)
				input.value = command_history[command_index] || "";
				save_command_history();
			}
			e.preventDefault();
			
		}
	});

	this.element = console_element;
	this.input = input;

	this.handleUncaughtErrors = function() {
		window.onerror = error;
	};

	this.log = log;
	this.logHTML = logHTML;
	this.error = error;
	this.warn = warn;
	this.info = info;
	this.success = success;
	this.getLastEntry = get_last_entry;
	this.clear = clear;

};
