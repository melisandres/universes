@props([
    'fieldId' => null, // Unique ID for this field instance
    'label' => '',
    'value' => '',
    'placeholder' => 'Not set',
    'type' => 'text', // text, textarea, select, etc.
    'name' => '', // Form field name
    'required' => false,
    'options' => [], // For select fields
    'rows' => 3, // For textarea
    'customView' => null, // Custom view template for complex fields
    'customEdit' => null, // Custom edit template for complex fields
])

@php
    $fieldId = $fieldId ?? 'field-' . uniqid();
    $viewId = "inline-view-{$fieldId}";
    $editId = "inline-edit-{$fieldId}";
@endphp

<div class="inline-editable-field" data-field-id="{{ $fieldId }}">
    <label class="inline-field-label">{{ $label }}</label>
    
    {{-- View Mode: Display value with pencil icon --}}
    <div id="{{ $viewId }}" class="inline-field-view">
        <span class="inline-field-value">{{ $value ?: $placeholder }}</span>
        <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit {{ $label }}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    </div>
    
    {{-- Edit Mode: Form input --}}
    <div id="{{ $editId }}" class="inline-field-edit d-none">
        @if($customEdit)
            @include($customEdit, ['fieldId' => $fieldId, 'name' => $name, 'value' => $value, 'required' => $required])
        @elseif($type === 'textarea')
            <textarea 
                name="{{ $name }}" 
                id="input-{{ $fieldId }}"
                class="inline-field-input"
                rows="{{ $rows }}"
                @if($required) required @endif
            >{{ $value }}</textarea>
        @elseif($type === 'select')
            <select 
                name="{{ $name }}" 
                id="input-{{ $fieldId }}"
                class="inline-field-input"
                @if($required) required @endif
            >
                @foreach($options as $optionValue => $optionLabel)
                    <option value="{{ $optionValue }}" @selected($value == $optionValue)>
                        {{ $optionLabel }}
                    </option>
                @endforeach
            </select>
        @else
            <input 
                type="{{ $type }}" 
                name="{{ $name }}" 
                id="input-{{ $fieldId }}"
                class="inline-field-input"
                value="{{ $value }}"
                @if($required) required @endif
            >
        @endif
        <div class="inline-field-actions">
            <button type="button" class="inline-field-save-btn" data-field-id="{{ $fieldId }}">Save</button>
            <button type="button" class="inline-field-cancel-btn" data-field-id="{{ $fieldId }}">Cancel</button>
        </div>
    </div>
</div>
