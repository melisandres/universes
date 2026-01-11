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
    'customDisplayValue' => null, // Custom display value (for select fields to show text instead of value)
])

@php
    $fieldId = $fieldId ?? 'field-' . uniqid();
    $viewId = "inline-view-{$fieldId}";
    $editId = "inline-edit-{$fieldId}";
@endphp

<div class="inline-editable-field" data-field-id="{{ $fieldId }}">
    {{-- Label and Pencil (always visible) --}}
    @if($label)
        <div class="inline-field-label-row">
            <label class="inline-field-label">{{ $label }}</label>
            <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit {{ $label }}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            </button>
        </div>
    @endif
    
    {{-- View Mode: Display value --}}
    <div id="{{ $viewId }}" class="inline-field-view{{ !$label ? ' inline-field-view-no-label' : '' }}">
        @if(!$label)
            <span class="inline-field-value" data-placeholder="{{ $placeholder }}">{{ $customDisplayValue ?? ($value ?: $placeholder) }}</span>
            <button type="button" class="inline-field-edit-btn" data-field-id="{{ $fieldId }}" aria-label="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            </button>
        @else
            <span class="inline-field-value" data-placeholder="{{ $placeholder }}">{{ $customDisplayValue ?? ($value ?: $placeholder) }}</span>
        @endif
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
        </div>
    </div>
</div>
