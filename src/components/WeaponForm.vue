<script setup></script>

<template>
	<Card>
		<template #content>
			<div style="display: flex; flex-direction: column">
				<InputText class="inputField" placeholder="Weapon Name"> test </InputText>
				<InputText class="inputField" placeholder="Weapon Definition"></InputText>
				<InputText
					class="inputField"
					placeholder="How many pieces of steel are used to make it?"
				></InputText>
				<InputText
					class="inputField"
					placeholder="How many components are used to make it?"
				></InputText>
				<InputText
					class="inputField"
					placeholder="How much work is needed to make it?"
				></InputText>
				<inputText
					class="inputField"
					placeholder="How much does it weight? (kg)"
				></inputText>
				<inputText
					class="inputField"
					placeholder="What is the touch range accuracy?"
				></inputText>
				<inputText
					class="inputField"
					placeholder="What is the short range accuracy?"
				></inputText>
				<inputText
					class="inputField"
					placeholder="What is the medium range accuracy?"
				></inputText>
				<inputText
					class="inputField"
					placeholder="What is the long range accuracy?"
				></inputText>
				<inputText
					class="inputField"
					placeholder="How much time is there between shots? (seconds)"
				></inputText>
				<FileUpload
					ref="fileupload"
					mode="basic"
					name="demo[]"
					url="/api/upload"
					accept="image/*"
					:maxFileSize="1000000"
					@upload="onUpload"
				/>
				<!-- stat bonuses -->
				<!-- custom projectiles -->
				<!-- tools -->
				<!-- recipe maker -->
				<!-- research -->
			</div>
		</template>
	</Card>
</template>

<style scoped>
.inputField {
	margin: 5px;
}
</style>
