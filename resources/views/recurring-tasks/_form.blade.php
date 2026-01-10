<label>Name</label><br>
<input type="text" name="name" value="{{ old('name', $recurringTask->name ?? '') }}" required><br><br>

<label>Universes (optional - at least one required to create first task instance)</label><br>
<div id="universes-container">
    @if(isset($recurringTask))
        @php
            $recurringTask->load('universeItems.universe');
            $universeItems = $recurringTask->universeItems->sortByDesc('is_primary');
        @endphp
        @foreach($universeItems as $index => $universeItem)
            <div class="universe-item-row" data-index="{{ $index }}">
                <select name="universe_ids[]" class="universe-select">
                    <option value="">— select universe —</option>
                    @foreach ($universes as $u)
                        <option value="{{ $u->id }}" @selected($universeItem->universe_id == $u->id)>
                            {{ $u->name }}
                        </option>
                    @endforeach
                </select>
                <label>
                    <input type="radio" name="primary_universe" value="{{ $index }}" @checked($universeItem->is_primary)>
                    Primary
                </label>
                <button type="button" class="remove-universe-btn" onclick="removeUniverseRow(this)">Remove</button>
            </div>
        @endforeach
        @if($universeItems->isEmpty())
            <div class="universe-item-row" data-index="0">
                <select name="universe_ids[]" class="universe-select">
                    <option value="">— select universe —</option>
                    @foreach ($universes as $u)
                        <option value="{{ $u->id }}">{{ $u->name }}</option>
                    @endforeach
                </select>
                <label>
                    <input type="radio" name="primary_universe" value="0" checked>
                    Primary
                </label>
                <button type="button" class="remove-universe-btn" onclick="removeUniverseRow(this)">Remove</button>
            </div>
        @endif
    @else
        <div class="universe-item-row" data-index="0">
            <select name="universe_ids[]" class="universe-select">
                <option value="">— select universe —</option>
                @foreach ($universes as $u)
                    <option value="{{ $u->id }}" @selected(old('universe_id') == $u->id)>
                        {{ $u->name }}
                    </option>
                @endforeach
            </select>
            <label>
                <input type="radio" name="primary_universe" value="0" checked>
                Primary
            </label>
            <button type="button" class="remove-universe-btn" onclick="removeUniverseRow(this)">Remove</button>
        </div>
    @endif
</div>
<button type="button" onclick="addUniverseRow()" style="margin-top: 10px;">+ Add Universe</button><br><br>

<label>Frequency</label><br>
Every <input type="number" name="frequency_interval" min="1" value="{{ old('frequency_interval', $recurringTask->frequency_interval ?? 1) }}" required>
<select name="frequency_unit" required>
    @foreach (['day','week','month'] as $unit)
        <option value="{{ $unit }}" @selected(old('frequency_unit', $recurringTask->frequency_unit ?? '') === $unit)>
            {{ ucfirst($unit) }}
        </option>
    @endforeach
</select><br><br>

<label>Default Duration (minutes, optional)</label><br>
<input type="number" name="default_duration_minutes" min="0" value="{{ old('default_duration_minutes', $recurringTask->default_duration_minutes ?? '') }}"><br><br>

<label>Notes (optional)</label><br>
<textarea name="notes">{{ old('notes', $recurringTask->notes ?? '') }}</textarea><br><br>

<label>
    <input type="checkbox" name="active" value="1" @checked(old('active', $recurringTask->active ?? true))>
    Active
</label><br><br>
