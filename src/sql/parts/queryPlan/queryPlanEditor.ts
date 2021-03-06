/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!sql/parts/query/editor/media/queryEditor';
import * as DOM from 'vs/base/browser/dom';
import { TPromise } from 'vs/base/common/winjs.base';
import { EditorOptions } from 'vs/workbench/common/editor';
import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { QueryPlanInput } from 'sql/parts/queryPlan/queryPlanInput';
import { QueryPlanModule } from 'sql/parts/queryPlan/queryPlan.module';
import { IConnectionManagementService } from 'sql/platform/connection/common/connectionManagement';
import { IMetadataService } from 'sql/platform/metadata/common/metadataService';
import { IScriptingService } from 'sql/platform/scripting/common/scriptingService';
import { IQueryEditorService } from 'sql/workbench/services/queryEditor/common/queryEditorService';
import { bootstrapAngular } from 'sql/services/bootstrap/bootstrapService';
import { IQueryPlanParams } from 'sql/services/bootstrap/bootstrapParams';
import { QUERYPLAN_SELECTOR } from 'sql/parts/queryPlan/queryPlan.component';
import { CancellationToken } from 'vs/base/common/cancellation';
import { IStorageService } from 'vs/platform/storage/common/storage';

declare let QP;

export class QueryPlanEditor extends BaseEditor {

	public static ID: string = 'workbench.editor.queryplan';

	constructor(
		@ITelemetryService telemetryService: ITelemetryService,
		@IThemeService themeService: IThemeService,
		@IInstantiationService private instantiationService: IInstantiationService,
		@IConnectionManagementService private _connectionService: IConnectionManagementService,
		@IMetadataService private _metadataService: IMetadataService,
		@IScriptingService private _scriptingService: IScriptingService,
		@IQueryEditorService private _queryEditorService: IQueryEditorService,
		@IStorageService private storageService: IStorageService
	) {
		super(QueryPlanEditor.ID, telemetryService, themeService, storageService);
	}

	/**
	 * Called to create the editor in the parent element.
	 */
	public createEditor(parent: HTMLElement): void {
		//Enable scrollbars when drawing area is larger than viewport
		parent.style.overflow = 'auto';
		//Set background of parent to white (same as .qp-root from src\sql\parts\grid\load\css\qp.css)
		//This is because the bottom-most tooltips can extend past the drawing area, which causes the
		//scrolling area to have gaps on the bottom and left. So if the colors aren't matched then
		//these gaps show up as different colors and look bad.
		//Another option would be to check the tooltip positions and reposition them if necessary
		//during the load - but changing the background color was the simplest and least error prone
		//(plus it's probable that we won't be using this control in the future anyways if development)
		//continues on the Query plan feature
		parent.style.background = '#fff';
	}

	/**
	 * Sets focus on this editor. Specifically, it sets the focus on the hosted text editor.
	 */
	public focus(): void {
	}

	/**
	 * Updates the internal variable keeping track of the editor's size, and re-calculates the sash position.
	 * To be called when the container of this editor changes size.
	 */
	public layout(dimension: DOM.Dimension): void {
	}

	public setInput(input: QueryPlanInput, options: EditorOptions): Thenable<void> {
		if (this.input instanceof QueryPlanInput && this.input.matches(input)) {
			return TPromise.as(undefined);
		}

		if (!input.hasInitialized) {
			this.bootstrapAngular(input);
		}
		this.revealElementWithTagName(input.uniqueSelector, this.getContainer());

		return super.setInput(input, options, CancellationToken.None);
	}

	/**
	 * Reveal the child element with the given tagName and hide all other elements.
	 */
	private revealElementWithTagName(tagName: string, parent: HTMLElement): void {
		let elementToReveal: HTMLElement;

		for (let i = 0; i < parent.children.length; i++) {
			let child: HTMLElement = <HTMLElement>parent.children[i];
			if (child.tagName && child.tagName.toLowerCase() === tagName && !elementToReveal) {
				elementToReveal = child;
			} else {
				child.style.display = 'none';
			}
		}

		if (elementToReveal) {
			elementToReveal.style.display = '';
		}
	}

	/**
	 * Load the angular components and record for this input that we have done so
	 */
	private bootstrapAngular(input: QueryPlanInput): void {
		// Get the bootstrap params and perform the bootstrap
		let params: IQueryPlanParams = {
			planXml: input.planXml
		};

		let uniqueSelector = bootstrapAngular(this.instantiationService,
			QueryPlanModule,
			this.getContainer(),
			QUERYPLAN_SELECTOR,
			params);
		input.setUniqueSelector(uniqueSelector);
	}

	public dispose(): void {
		super.dispose();
	}
}
