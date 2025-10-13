
# Intro
Create a GQL API inside the services/core-api folder that support the Frontend application that we developed earlier, GQL API will use a postgress RDS in the remote, and will use a local docker run locally (We should create that for the GQL API) inside the same docker-compose file when starrting the stack localy (infra/docker/docker-compose.dev.yml)

Also, Makesure to for the postgress we need a seed script to create the files, user prima ORM for database things and migrations. 

Application code should go inside the services/core-api. 

Must follow the industry best practies when creating the GQL API, this should have middlewares to validate the cognito token expiration for now before accepting any requetss, also should have a health endpoint support as we are deploying this API in a dockerised container to the AWS ECS. For the docker you must create two file, one is docker.dev for local testing with hot reloading and default docker file pro production ECS deployment.

Must use nodejs 24 tls and typescript, should have all the liting and everything supported. Will use apoloo graphql latest version.

All the libraries that we are using should use the latest version, should not use any depricated libraries/functions. As needed you may use context7 API to access libarry docunetaitons. 

The developed frontend application canbe found here @/apps/web  to understand what things we need to develop inside the the GQL API, and also some fe contract definitions we defined/designed while we are implementing the fronend can be found here @/specs/001-create-a-cutting/contracts , but double check when we are implementing the GQL API.

The rquirements are here which we used to develop the frontend is here, by looking at that decide what we need for the GQL API: @/docs/scratches/01-initial.md 

The  application agentic flow is here @/docs/architecture/agent-core/agent-flow-diagram.md , You MUST support this flow for project createion etc when buidling the GQL API.

Frontend (Already developed), OUR GQL API we develop shoul support the fronend following folows:

Application Flow When Doing a Bid:

A. User create a project for a new bid, if there's nothing already, when creating a project use will navigate to /projects/new page, and use will input the following:
	> Add a Project Name
	> Add a Description (Optinal)
	> Add a Deadline (Optinal)
	> Way to Upload Project Documents (Word, Excel, PDF, Audio, Video)
	> Multi-Select - Search and Select Multiple Knowledge Bases (Local or Global)
	> Add Users to Project (Optinal)
	> Button at the bottom ("Start")

B. Once user click on the "Start" button following, UI shoul be change to the processing UI. In the Processing UI this will happen.
	1. With the data provided FE will send a requesst to backend GQL api to create a project with relevant details.
	2. Once above is done, FE will send an another request to backend GQL api to create a pre-signed s3 URL to upload project documents (Word, Excel, PDF, Audio, Video), and once the URL is received frontend should upload the files to S3 directly, and FE we should see the processing are updating on the top progress bar along with processing section animation, it should update the DB records about the project file locations (ProjectDocument). 
		- S3 Presigned URL will follow the (yyyy/mm/dd/hh/<url_friendly_project_name>_<timestamp>) format
	2. Once the project record is created in the DB, and files are uploaded sucessfully, FE will trigger the Agent execution, using the AgentCore runtime endpoint.
	3. In the AgentCore we have a Supervisor Agent, with a pool of sub agents specialsied in different domains. The first request will go to the supervisor form the FE, from there onwards the Supervisor Agent will handle the orchestration flow. 
	4. This Agentic Flow is wrapped by the fast API, hence all the payload will go into /invocations endpoint (this is a hard requirement by the agentcore API), and then the request will pass to graph. And in the main API will validate the initial requiest for the correct payload. The payload should contain the following
		- project_id
		- user_id
		- session_id
		- start - Hint for the supervisor agent to understad this is a new project request, this will set to "true" by the FE, for the first time when the user click on "Start" buttong, for all the proceeding chat inputs, this will be set to "false"
		- user_input - User input for a question or feedback or content edit payload (all are optional)
			- chat
			- content_edits

	5. Once the request is received, supevisor should invoke a tool/mcp call to postgress to make a DB record for the agentic flow with the status "Open". Supervisor will crete a WorkflowExecution record along with Agent Task in the order they should execute this workflow. The workflow should have the following in the order. Each tasks will have the following status ("Open", "InProgress", "Waiting" ,"Completed", "Failed") - Waiting is a state when the agent is waiting for an input from the user, and WorkflowExecution will also have the same status, that status only be updated by the supervisor, depending on the outcome of the acitvity by the agents and feedback by the users.
		a). Parser Agent Task - Parser Agent Should process the documents uploaded in the given location
		b). Analysis Agent Task - Analyses the Documents, and Figure out what to do, what out out to provide
		c). Content Agent Task (Agents as a Tool) - Uses Knowledge Agent to Retrives Internal Data (Past Bids, Q & A Answeres) from the Bedrock Knowledge Bases, and create Drafts (Makrdown file) to for user to review with the content type.
		d). Compliance Agent Task - Verify the compliance Requirements. 
		e). QA Agent Task - Verify the artifacts meets the standards and the Outputs requrested
		f). Comms Agent Task - Send out emails/slack notifications when the tasks are done
		e). Submission Agent Task - Once the user approved, it can submit the documents to given portals.
		- Along with the above supervisor should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the workflow - This should be updated by start of each workflow execution (should rely on the start flag in the initialy payload)
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the workflow
			uuid handled_by FK "" - For the initiatl request this will  be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the workflow
			uuid completed_by FK "" - Once the workflow steps are completed - this should be updated with user id of the last user who completed the workflow

	6. Once the supervisor accepted the request it will pass the request detiails to the Parser Agent, paser agent will have access to postgress tool/mcp to access retrived the required details.
		- Agent first mark the Parser AgentTask as InProgress, update the input_data and contine with the parsing task, for the parsing task the agent should accesss the Project and should get all the documents from the ProjectDocument records from the database.
		- Once the agent retrived all the ProjectDocument documents from the database, it should retrive the locations (i.e raw_file_location) and pass that to bedrock Data Automation tool to process the documents and save it onto a predefined location (S3), for that the agent will use use correct tools/mcp accordingly.
		- Once the agent done with that task he will provide a feedback to the supervisor agent and update the Parser Agent Task details accordingly.
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- If the task is successfull, the agent should write the processed file location into the output_data and also should update the each ProjectDocument's processed_file_location accordingly and mark the AgentTask as completed, so that the supervisor and pickup and pass that to the Analysis Agent

	7. Once the Parser Agent passed back to the Supervisor agent, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the parsing successful, the supervisor agent should ask Analysis Agent to work on the Analysis Agent Task. And should update the Project's progress_percentage value (Depending on how many agent tasks we have completed) and other related data.
	8. Once the supervisor handsoff that to the Analysis Agent;
		- Agent first mark the Analysis AgentTask as InProgress, update the input_data and contine with the Analysis task, for the Analysis task the agent should accesss the output for the previous Parse Agent tasks's output (output_data) from the database.
		- Once agent retrives the document data (from the S3 file location) which was available in the Parser ProjectDocument processed_file_location, then it should be used as the context to analyse and produced the following data in markdown format to be ready to present that to the user. And this markdown should contain following details:

			a. Who is the Client (Name, Location, Domain, Contact Details)
			b. Key Stakeholder and Their Roles
			c. Understand the Ask (What the client is asking for this RFP/Bid)
			d. Figure out the Opportunity (What are the key opportunies for our company)
			e. Figure out the Process (What's the current RFP/Bid processs)
			f. Understand what documents to provide
				- Questioner Answered (pdf/doc) - RFP Q and A document
				- Due Diligence Questions / Company Credentains (Corporate profile, legal entity info, financial stability reports, insurances, certifications (ISO, SOC2, GDPR compliance, etc.).) Answered (pdf/doc)
				- System Designed Prepared (pdf/doc)
				- Presentation ? (pdf/ppt)
				- Pricing / Commercial Proposal – Detailed cost breakdown (licensing, implementation, support, optional services).
				- Conver Letter (pdf/doc)
				- Compliance Matrix – Mapping of client requirements vs. your compliance (Yes/Partial/No).
				- Executive Summary (pdf/doc)
				- What else (Demo, POC) ?
				- References & Case Studies – Similar projects which we have delivered successfully.
			g. Deadline dates
			h. How to submit the documents - Portal (login details), Email
		- Once the agent is extracted the above detials successfully it should write to the output_data
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent.
	9. Once the Analysis Agent passed back to the Supervisor agent, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the analysis successful, the supervisor agent should send the update to the user with the out come of the analysi to the user in Markdown format, so that the user can review and provide feedback if there's anything to be updated/changed.
	10. Then once the supervisor pass the output to the user, user view review and will identify if there any gaps, or things needs to be updated and send a feedback back to the supervisor, supervisor should understand the intent of the feedback should continue the follow accordingly. If the feedback saying issue with parsing, it should kick of the workflow from the start, the supervisor should rest the Parsing Agent Task and Analysis Agent Task and rerun the process to fill the gaps, if the feedback is just an issue with analysis, the supervisor should reest the  Analysis Agent Task  and should rerun the task from the bening, this will go on a loop, until the user is satisfied by the analysis outcome.
	11. Once the user is satisfied, the supervisor then should pass that to the Content Agent to prepare the content for the documents we need to submit for thisd RFP/Bid (Outcome of Point 8 - f).
		- Agent first mark the Content AgentTask as InProgress, update the input_data and contine with the Content task, for the Content task the agent should accesss the output for the previous Analysis Agent tasks's output (output_data) from the database.
		- Once agent retrives the output data which was available in the Analysis AgentTask output, then it figure out how many and what documents need to be provided for this RFP and Bid.
		- Then the Content Agent will use the Knowledge Agent who has access to Bedrock Knowledge bases to retrivev the related data for each type of documents we need to provide.
		- When providing the output this agent will create the following strcture for the documents/artifacts, will save the structure in the database under the Artifact tables and will update ArtifactVersion table accordingly with the content for each type of artifact we want to create.
			a. All the generate documents should have the following format to send to the frontend
				{
					type: <worddoc | pdf | ppt | excel>, 
					category: <  document | q_and_a | excel >,
					title: <Title of the documents>, 
					meta_data: <created_at, last_modified_at, created_by, updated_by>
					content: <content should be changed depending on the category to support with frontend renderig>
					tags: < system_design | cover_letter | exec_summary | case_studies | rfp_q_and_a | due_deligence_q_and_a , etc >,
				}

				NOTE: For the type worddoc | pdf  and cateogory document should have the frontend tiptap library native formatting for the content to support with easy parsing and rendering on the frontend

				----

				Following are some of the examples:

				Example 1: Word Document (Exec Summary) 

				{
				  "type": "worddoc",
				  "category": "document",
				  "title": "AI Adoption Executive Summary",
				  "meta_data": {
				    "created_at": "2025-10-02T07:00:00Z",
				    "last_modified_at": "2025-10-02T09:30:00Z",
				    "created_by": "Chamika Bandara",
				    "updated_by": "Chamika Bandara"
				  },
				  "tags": ["exec_summary", "ai_strategy"],
				  "content": {
				    "type": "doc",
				    "content": [
				      {
				        "type": "heading",
				        "attrs": { "level": 1 },
				        "content": [
				          { "type": "text", "text": "AI Adoption Executive Summary" }
				        ]
				      },
				      {
				        "type": "heading",
				        "attrs": { "level": 2 },
				        "content": [{ "type": "text", "text": "Introduction" }]
				      },
				      {
				        "type": "paragraph",
				        "content": [
				          {
				            "type": "text",
				            "text": "This executive summary outlines our AI adoption strategy, focusing on efficiency, cost savings, and compliance."
				          }
				        ]
				      },
				      {
				        "type": "heading",
				        "attrs": { "level": 2 },
				        "content": [{ "type": "text", "text": "Key Benefits" }]
				      },
				      {
				        "type": "paragraph",
				        "content": [
				          {
				            "type": "text",
				            "text": "The adoption of AI provides several measurable benefits:"
				          }
				        ]
				      },
				      {
				        "type": "bulletList",
				        "content": [
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Reduce incident resolution times by up to 75%" }
				                ]
				              }
				            ]
				          },
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Improve fraud detection accuracy" }
				                ]
				              }
				            ]
				          },
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Enable real-time decision making" }
				                ]
				              }
				            ]
				          }
				        ]
				      },
				      {
				        "type": "heading",
				        "attrs": { "level": 2 },
				        "content": [{ "type": "text", "text": "Implementation Phases" }]
				      },
				      {
				        "type": "paragraph",
				        "content": [
				          { "type": "text", "text": "We propose a phased rollout of AI capabilities:" }
				        ]
				      },
				      {
				        "type": "orderedList",
				        "attrs": { "order": 1 },
				        "content": [
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Phase 1: Proof of Concept with fraud detection" }
				                ]
				              }
				            ]
				          },
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Phase 2: Expansion to compliance monitoring" }
				                ]
				              }
				            ]
				          },
				          {
				            "type": "listItem",
				            "content": [
				              {
				                "type": "paragraph",
				                "content": [
				                  { "type": "text", "text": "Phase 3: Full integration into operations" }
				                ]
				              }
				            ]
				          }
				        ]
				      }
				    ]
				  }
				}


				Example 2: Q&A Document (RFP Q&A)

				{
				  "type": "pdf",
				  "category": "q_and_a",
				  "title": "RFP Q&A Responses - Security Policy",
				  "meta_data": {
				    "created_at": "2025-10-01T14:00:00Z",
				    "last_modified_at": "2025-10-01T16:00:00Z",
				    "created_by": "Security Agent",
				    "updated_by": "Legal Review Team"
				  },
				  "tags": ["rfp_q_and_a", "security"],
				  "content": {
				    "q_and_a": [
				      {
				        "question": "What is your approach to Zero Trust security?",
				        "proposed_answer": "Our Zero Trust framework requires all users and devices to authenticate continuously using MFA and device posture checks.",
				        "past_answers": [
				          {
				            "answer": "Zero Trust is implemented via perimeter security and VPN authentication.",
				            "reference_link": "https://company-docs.com/security/zerotrust-2023.pdf"
				          },
				          {
				            "answer": "We enforce Zero Trust at the application layer using role-based access controls.",
				            "reference_link": "https://company-docs.com/security/zerotrust-2022.pdf"
				          }
				        ]
				      },
				      {
				        "question": "How often do you conduct access reviews?",
				        "proposed_answer": "Access reviews for privileged accounts are conducted quarterly, while all user accounts are reviewed annually.",
				        "past_answers": [
				          {
				            "answer": "Access reviews were previously done bi-annually for all users.",
				            "reference_link": "https://company-docs.com/security/access-review-2021.docx"
				          }
				        ]
				      }
				    ]
				  }
				}

		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- If the task is successfull, the agent should write the details of the artifacts created into the output_data, and mark the AgentTask as completed, so that the supervisor and pickup and pass that to the Next Agent
	12. Once the Content Agent completed the analysis it will handoff back to the supervisor agent with the outcome, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the content createion successful, the supervisor agent should send the update to the frontend, saying the content creation is done (Without the actual content, because it needs to be reviwed by other agents in the workflo), then it should pass to the Complience Agent to do the complience check on the content created. 
	13.  Once the supervisor handsoff that to the Compliance Agent;
		- Agent first mark the Compliance AgentTask as InProgress, update the input_data and contine with the Complience task, for the Complience task the agent should accesss the output for the previous Content Agent tasks's output (output_data) and Project info from the database and figure out how to access the artifacts created by the Content Agent.(Should access Artifact table and ArtifactVersion tables for this, and from the ArtifactVersion tables shold retrive the latest version), Should be using a MCP/Tool call with the RDS postgress DB
		- Once the Complience Agent has access to the artifacts and it's content, For each artifact he will review against a set of Compliance checks, Deloitte Standards etc and provide a feedback on each document as follows.

		Sample Feedback for a single artiflact, output shoudl be an array of this.
		{
			  "name": "AI Adoption Executive Summary",
			  "type": "worddoc",
			  "content": { /* TipTap JSON for the document */ },
			  "feedback": [
			    {
			      "section": "Introduction",
			      "issues": [
			        {
			          "description": "Missing reference to latest AI compliance framework 2025.",
			          "references": [
			            {
			              "title": "AI Ethics Guidelines 2025",
			              "link": "https://company-docs.com/ai-ethics-2025.pdf"
			            }
			          ],
			          "suggestions": [
			            "Add a paragraph referencing AI Ethics Guidelines 2025."
			          ]
			        },
			        {
			          "description": "No mention of data privacy guidelines.",
			          "references": [
			            {
			              "title": "GDPR Compliance Summary",
			              "link": "https://company-docs.com/gdpr-summary.pdf"
			            }
			          ],
			          "suggestions": [
			            "Include a note about GDPR compliance for EU operations."
			          ]
			        }
			      ]
			    },
			    {
			      "section": "Key Benefits",
			      "issues": [
			        {
			          "description": "Claims about efficiency lack supporting metrics.",
			          "references": [
			            {
			              "title": "Operational Metrics Report Q3 2025",
			              "link": "https://company-docs.com/metrics-q3-2025.pdf"
			            }
			          ],
			          "suggestions": [
			            "Include recent benchmark data to support efficiency claims."
			          ]
			        }
			      ]
			    }
			  ]
			}

		- The agent should genera the feedback for all the artifacts successfully.
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there is a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent with the outcome of whether the content is complient or not.

	14. Once the Complient Agent handsoff back to the supervisor with the complience outcome, he may decide to go to next step or to re-run the previous step depending on the complient status.
		- If it is not complient, supervisor may pass that back to the Content Agent to fix the issues,then the Content agent will go through the same process and update the content with the feedback, which can be found in the Complience Agent's task output in the DB and come back again, until the Compliance agent is happy. Once the Complient agent is happy the supervisor agent will move to the next step with the QA Agent.
		- Also, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. 
	15. Once the supervisor handsoff to the QA Agent
		- Agent first mark the QA Agent AgentTask as InProgress, update the input_data and contine with the QA task, for the QA task the agent should accesss the output for the previous Content Agent tasks's output (output_data) and Project info from the database and figure out how to access the artifacts created by the Content Agent.(Should access Artifact table and ArtifactVersion tables for this, and from the ArtifactVersion tables shold retrive the latest version), Also the agent needs to access to the Analysis agent task's output - All DB operations Should be done using a MCP/Tool call with the RDS postgress DB. 
		- Once the QA Agent has access to the artifacts and it's content and the output from the Analysis agent to figure out what documents and informations needs to provide, This agent will scan through all the documents and anayse to find out any gaps, if there are not more gaps, agent will handsoff back to the supervisor, if not the agent will provide a feedback on each document on what's missing also, if some documents are not provided, then again he will pass a seperate note to the supervisor agent on the missing artifacts.

		For the output the agent should follow the following schema:

		{
		  "project_id": "string", // ID/reference of the project
		  "artifacts_reviewed": [
		    {
		      "name": "string", // artifact name/title
		      "type": "worddoc | pdf | excel | q_and_a | ppt",
		      "submitted_content": {}, // original content JSON (TipTap, tables, Q&A)
		      "feedback": [
		        {
		          "section_or_question_or_table": "string", // section heading, Q&A question, or table name
		          "description": "string", // issue or observation
		          "status": "met | partially_met | not_met", // evaluation of this item
		          "references": [ // optional references to justify feedback
		            {
		              "title": "string",
		              "link": "string"
		            }
		          ],
		          "suggestions": ["string"] // optional guidance to fix/complete
		        }
		      ]
		    }
		  ],
		  "missing_artifacts": [
		    {
		      "expected_name": "string",
		      "expected_type": "worddoc | pdf | excel | q_and_a | ppt",
		      "description": "string" // why this artifact is considered missing
		    }
		  ],
		  "summary": {
		    "total_artifacts_expected": 5,
		    "total_artifacts_submitted": 3,
		    "total_issues_found": 12,
		    "overall_status": "partial | complete | failed"
		  }
		}


		Example: 
		{
		  "project_id": "<uuid from DB>",
		  "artifacts_reviewed": [
		    {
		      "name": "AI Adoption Executive Summary",
		      "type": "worddoc",
		      "submitted_content": { /* TipTap JSON content */ },
		      "feedback": [
		        {
		          "section_or_question_or_table": "Introduction",
		          "description": "Missing reference to client-specific AI compliance requirements.",
		          "status": "not_met",
		          "references": [
		            {
		              "title": "Client AI Compliance Request",
		              "link": "https://client-docs.com/ai-compliance.pdf"
		            }
		          ],
		          "suggestions": ["Add a paragraph referencing client-specific compliance guidelines."]
		        },
		        {
		          "section_or_question_or_table": "Key Benefits",
		          "description": "Benefits are stated but no measurable metrics linked to client's KPIs.",
		          "status": "partially_met",
		          "suggestions": ["Include metrics from Q3 2025 that align with client's KPIs."]
		        }
		      ]
		    },
		    {
		      "name": "RFP Q&A Responses - Security Policy",
		      "type": "q_and_a",
		      "submitted_content": { /* Q&A JSON */ },
		      "feedback": [
		        {
		          "section_or_question_or_table": "Zero Trust Approach",
		          "description": "Proposed answer does not cover client-requested device posture checks.",
		          "status": "not_met",
		          "references": [
		            {
		              "title": "Client Zero Trust Requirements",
		              "link": "https://client-docs.com/zero-trust-ask.pdf"
		            }
		          ],
		          "suggestions": ["Update answer to include device posture verification as requested."]
		        }
		      ]
		    }
		  ],
		  "missing_artifacts": [
		    {
		      "expected_name": "System Design Component Matrix",
		      "expected_type": "excel",
		      "description": "Not submitted by the delivery team; required by client request."
		    },
		    {
		      "expected_name": "Fraud Detection Case Study",
		      "expected_type": "ppt",
		      "description": "Not submitted; expected for client review of previous implementations."
		    }
		  ],
		  "summary": {
		    "total_artifacts_expected": 5,
		    "total_artifacts_submitted": 3,
		    "total_issues_found": 4,
		    "overall_status": "partial"
		  }
		}

		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent with the outcome of whether the content is QA pass or not.
	16. Once the QA Agent handsoff back to the supervisor with the QA outcome, he may decide to go to next step or to re-run the previous step depending on the QA status.
		- If it is not passing QA, supervisor may pass that back to the Content Agent to fix the issues, and should reset the Content Agent Task, Complience Agent Task, and then it should restart from the begining while incorporating the feedback from the QA agent, which can be found unders the QA Agent Task's output and compliecn Agent feedback, which can be found under the Complience Agent Task;s outpout in DB. This process will go through a cycle untile the content is complient and QA Passed.
		- Once both the Complient agent and QA agents are happy the supervisor agent will move to the next step with the QA Agent.
		- Also , he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries.
	17. Once the artifacts are complient and QA passed, then the supervisor will send all the finalised artifacts which retrived from the database.  To figure out how to access the artifacts created by the Content Agent, agent should use(Should access Artifact table and ArtifactVersion tables, and from the ArtifactVersion tables shold retrive the latest version), Should be using a MCP/Tool call with the RDS postgress DB.
	18. Once the artifacts are received on the frontend, it should renders as clickable tile components for each artiefact on the chat interface of the user, And for each type of artifacts usesr should be able to edit and provide feedback when they click on each artiefact type. For that
		- Each artiefact and be rendered on a popup window
		- When clicking on the wordoc/pdf type and categoty is document artiefact it should show a popup window with a rich text editor (use tiptap) and upon changins and saving the edits will be stored in the app state.
		- When clicking on the wordoc/pdf type and categoty is q_and_a it should open through a popup window with a custom page/compoenent, which properly render each question/answer other things are properly listed down as seperate section, while allowing to edit each answer seperately.
		- When click on the excel type it should open on a editable table custom component within a popup window. 
		- Once user done with the edit and click save button (We should wait for all the documents to be edited) and user input something to the chat input box and send, that update again should go to the agentcore endpoint, and then to the supervisor agent.
	19. Then the agent will analys the input and if there are additional edits, supervisor will ask from use if they want to review this again with complience and QA, if yes supervisor should reest, relevant db state and again and send the process through the same cycle starting from the Content Agent step, if user responded no/ saying he is happy with what we got, the supervisor will ask permission to send notifations to project stakeholders. 
		- Before sending notifiations if the user is happy with the content or the edits, the supervisor will export those artifacts as files to S3,  and then it will update update content and location details of each artifact's latest version - ArtifactVersion (The supervisor will access Project, Artifact and ArtifactVersion tables for this) - for those the suprvisor will use DB and S3 MCP or Tool calls.
		- Then, If user granted send notifcation permision then the supervisro will pass that to the Comms Agent.
	20. Once the supervisor handsoff to the Comms Agent
		- Comms agent will access the each artifact and retrive the location of each file on the DB table ArtifactVersion for each artifact (The agent will access Project, Artifact and ArtifactVersion tables for this and fetch the location)
		- And then the comms agent will fetch the Project Members from ProjectMember table for the project, and will find their emails from the User table, and will create a slack channel and send out an notififcation about the project status, and the artifacts.  
		- Will create a notification record on the Notification table with a relevent messages, so that the From the frotned users will receive notifications from the subscriptions. 
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent with the outcome of whether the notifications has been sent or not.
	21. Once the Comms Agent done with it's task it will handoff back to the supervisor agent with the outcome, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the comms task is successful, the supervisor agent should send the update to the frontend, saying the comms is done.
		- Then again supervisor will ask from the users whether they are happy to email the proposal to the user.
	22. Once the user reply back to the supervisor agent saying yes, then supervisor will handsoff that to the Submission Agent, if the user reply with no, then the supervisro agent will mark the Submission Agent Task as completed, also the WorkflowExecution will be updated accordingly and send a message a user to saying the workflow has been completed.
		- If the user wants to Submit the Bid, then the Submission Agent will access the Analysis Agent Task output from the DB, will access the output, and then the Submitssion agent should figure out the contact/email details to submit to the client, And then before sending the email, the agent will crete a email draft and send the draft to supervisor agent, and then the supervisor agent will pass that back to the user to review, if the user is happy then the supervisor agent will again handsoff back to the Submission agent, and that agent will send out an email with the correct documents which asked by the client, and artifacts will be fetched by the Submitssion agent by retrive the location of each file on the DB table ArtifactVersion for each artifact (The agent will access Project, Artifact and ArtifactVersion tables for this and fetch the location), once the location is fetched, then the agent will add those as attachement to the gmail and sendout an email to the  client with correct title, body and the attachments.
		- When the supervisor is sending the email draft to the user to review will follow the following structure:
			{

				title: <email-title>,
				to: <>,
				from: <>,
				body: <richtext>
				attachemnts: [ {name: <name/title of the document>, url: <location of the document>}] 
			}
		- Along with the above the agent should maintain the following propertise as and when the things are happenig:
			%% User Id, who initiate the agent task - This should be updated by start of each task execution
			uuid initiated_by FK ""  
	        %% User Id, who is being handle the agent task
			uuid handled_by FK "" - For the initiatl request this will be same, but for the proceeding invocations, depending on the user id, this should get updated always.
	        %% User Id, who completed the agent task
			uuid completed_by FK "" - Once the agent task is completed - this should be updated with user id of the last user who completed the agent task
		- If there a failure it should update the AgentTask accordingly with error_message, error_log
		- Once the task is done, the agent should write the outcome into the output_data and mark the AgentTask as completed, then it should handoff back to the supervisor agent with the outcome of whether the email has been sent or not.
	23. Once the Submittion Agent done with it's task it will handoff back to the supervisor agent with the outcome, he will analys the outcome and update the WorkflowExecution entries with last_updated_at, also if there's an error it should update error_message and error_log entries. If the submission task is successful, the supervisor agent should send the update to the frontend, saying the email has been sent to the client.
		- Then the supervisro agent will mark the WorkflowExecution as completed and will be updated other fields accordingly and send a message a user to saying the workflow has been completed.
		- Also the supervisor agent will update the Project database table record with correct status "Completed" and "completed_by", "completed_at", "created_at", and "progress_percentage" as 100


- For evey handsoffs, supervisor upgates, client should receive evenstram updates, so that the in the frontend we can show the correct status updates, loading screens on the chat interface and the project interface.
