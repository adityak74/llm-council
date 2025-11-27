"""3-stage LLM Council orchestration."""

from typing import List, Dict, Any, Tuple
from .llm_client import query_models_parallel, query_model
from .config import COUNCIL_MODELS, CHAIRMAN_MODEL


async def stage1_collect_responses(
    user_query: str,
    council_members: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Stage 1: Collect individual responses from all council models.

    Args:
        user_query: The user's question
        council_members: List of dicts with 'model_id', 'name', 'system_prompt'

    Returns:
        List of dicts with 'model', 'response', 'persona_name' keys
    """
    messages = [{"role": "user", "content": user_query}]
    
    models = [m['model_id'] for m in council_members]
    system_prompts = [m.get('system_prompt') for m in council_members]

    # Query all models in parallel
    # Note: query_models_parallel returns a dict keyed by model_id.
    # If we have multiple personas using the same model, this simple dict approach fails.
    # We should query individually or update query_models_parallel to return a list.
    # For now, let's use query_models_parallel but be careful about duplicates.
    # Actually, let's just use query_model in a loop here to be safe and support duplicates.
    
    import asyncio
    tasks = [
        query_model(m['model_id'], messages, system_prompt=m.get('system_prompt'))
        for m in council_members
    ]
    
    responses = await asyncio.gather(*tasks)

    # Format results
    stage1_results = []
    for member, response in zip(council_members, responses):
        if response is not None:  # Only include successful responses
            stage1_results.append({
                "model": member['model_id'],
                "persona_name": member.get('name', member['model_id']),
                "response": response.get('content', '')
            })
        else:
            # Handle failure
            stage1_results.append({
                "model": member['model_id'],
                "persona_name": member.get('name', member['model_id']),
                "response": "Error: Failed to generate response."
            })

    return stage1_results


async def stage2_collect_rankings(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    council_members: List[Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
    """
    Stage 2: Each model ranks the anonymized responses.

    Args:
        user_query: The original user query
        stage1_results: Results from Stage 1
        council_members: List of council members (personas/models)

    Returns:
        Tuple of (rankings list, label_to_model mapping)
    """
    # Create anonymized labels for responses (Response A, Response B, etc.)
    labels = [chr(65 + i) for i in range(len(stage1_results))]  # A, B, C, ...

    # Create mapping from label to model name (or persona name)
    label_to_model = {
        f"Response {label}": result['persona_name']
        for label, result in zip(labels, stage1_results)
    }

    # Build the ranking prompt
    responses_text = "\n\n".join([
        f"Response {label}:\n{result['response']}"
        for label, result in zip(labels, stage1_results)
    ])

    ranking_prompt = f"""You are evaluating different responses to the following question:

Question: {user_query}

Here are the responses from different models (anonymized):

{responses_text}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Example of the correct format for your ENTIRE response:

Response A provides good detail on X but misses Y...
Response B is accurate but lacks depth on Z...
Response C offers the most comprehensive answer...

FINAL RANKING:
1. Response C
2. Response A
3. Response B

Now provide your evaluation and ranking:"""

    messages = [{"role": "user", "content": ranking_prompt}]

    # Get rankings from all council models in parallel
    import asyncio
    tasks = [
        query_model(m['model_id'], messages, system_prompt=m.get('system_prompt'))
        for m in council_members
    ]
    
    responses = await asyncio.gather(*tasks)

    # Format results
    stage2_results = []
    for member, response in zip(council_members, responses):
        if response is not None:
            full_text = response.get('content', '')
            parsed = parse_ranking_from_text(full_text)
            stage2_results.append({
                "model": member['model_id'],
                "persona_name": member.get('name', member['model_id']),
                "ranking": full_text,
                "parsed_ranking": parsed
            })
        else:
            # Handle failure
            stage2_results.append({
                "model": member['model_id'],
                "persona_name": member.get('name', member['model_id']),
                "ranking": "Error: Failed to generate ranking.",
                "parsed_ranking": []
            })

    return stage2_results, label_to_model


async def stage3_synthesize_final(
    user_query: str,
    stage1_results: List[Dict[str, Any]],
    stage2_results: List[Dict[str, Any]],
    chairman_member: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Stage 3: Chairman synthesizes final response.

    Args:
        user_query: The original user query
        stage1_results: Individual model responses from Stage 1
        stage2_results: Rankings from Stage 2
        chairman_member: The chairman persona/model configuration

    Returns:
        Dict with 'model' and 'response' keys
    """
    # Build comprehensive context for chairman
    stage1_text = "\n\n".join([
        f"Model: {result['persona_name']}\nResponse: {result['response']}"
        for result in stage1_results
    ])

    stage2_text = "\n\n".join([
        f"Model: {result['persona_name']}\nRanking: {result['ranking']}"
        for result in stage2_results
    ])

    chairman_prompt = f"""You are the Chairman of an LLM Council. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

Original Question: {user_query}

STAGE 1 - Individual Responses:
{stage1_text}

STAGE 2 - Peer Rankings:
{stage2_text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's original question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:"""

    messages = [{"role": "user", "content": chairman_prompt}]

    # Query the chairman model
    response = await query_model(
        chairman_member['model_id'], 
        messages, 
        system_prompt=chairman_member.get('system_prompt')
    )

    if response is None:
        # Fallback if chairman fails
        return {
            "model": chairman_member['model_id'],
            "persona_name": chairman_member.get('name', chairman_member['model_id']),
            "response": "Error: Unable to generate final synthesis."
        }

    return {
        "model": chairman_member['model_id'],
        "persona_name": chairman_member.get('name', chairman_member['model_id']),
        "response": response.get('content', '')
    }


def parse_ranking_from_text(ranking_text: str) -> List[str]:
    """
    Parse the FINAL RANKING section from the model's response.

    Args:
        ranking_text: The full text response from the model

    Returns:
        List of response labels in ranked order
    """
    import re

    # Look for "FINAL RANKING:" section
    if "FINAL RANKING:" in ranking_text:
        # Extract everything after "FINAL RANKING:"
        parts = ranking_text.split("FINAL RANKING:")
        if len(parts) >= 2:
            ranking_section = parts[1]
            # Try to extract numbered list format (e.g., "1. Response A")
            # This pattern looks for: number, period, optional space, "Response X"
            numbered_matches = re.findall(r'\d+\.\s*Response [A-Z]', ranking_section)
            if numbered_matches:
                # Extract just the "Response X" part
                return [re.search(r'Response [A-Z]', m).group() for m in numbered_matches]

            # Fallback: Extract all "Response X" patterns in order
            matches = re.findall(r'Response [A-Z]', ranking_section)
            return matches

    # Fallback: try to find any "Response X" patterns in order
    matches = re.findall(r'Response [A-Z]', ranking_text)
    return matches


def calculate_aggregate_rankings(
    stage2_results: List[Dict[str, Any]],
    label_to_model: Dict[str, str]
) -> List[Dict[str, Any]]:
    """
    Calculate aggregate rankings across all models.

    Args:
        stage2_results: Rankings from each model
        label_to_model: Mapping from anonymous labels to model names

    Returns:
        List of dicts with model name and average rank, sorted best to worst
    """
    from collections import defaultdict

    # Track positions for each model
    model_positions = defaultdict(list)

    for ranking in stage2_results:
        ranking_text = ranking['ranking']

        # Parse the ranking from the structured format
        parsed_ranking = parse_ranking_from_text(ranking_text)

        for position, label in enumerate(parsed_ranking, start=1):
            if label in label_to_model:
                model_name = label_to_model[label]
                model_positions[model_name].append(position)

    # Calculate average position for each model
    aggregate = []
    for model, positions in model_positions.items():
        if positions:
            avg_rank = sum(positions) / len(positions)
            aggregate.append({
                "model": model,
                "average_rank": round(avg_rank, 2),
                "rankings_count": len(positions)
            })

    # Sort by average rank (lower is better)
    aggregate.sort(key=lambda x: x['average_rank'])

    return aggregate


async def generate_conversation_title(user_query: str) -> str:
    """
    Generate a short title for a conversation based on the first user message.

    Args:
        user_query: The first user message

    Returns:
        A short title (3-5 words)
    """
    title_prompt = f"""Generate a very short title (3-5 words maximum) that summarizes the following question.
The title should be concise and descriptive. Do not use quotes or punctuation in the title.

Question: {user_query}

Title:"""

    messages = [{"role": "user", "content": title_prompt}]

    # Use a small local model for title generation
    response = await query_model("ollama/amsaravi/medgemma-4b-it:q8", messages, timeout=600.0)

    if response is None:
        # Fallback to a generic title
        return "New Conversation"

    title = response.get('content', 'New Conversation').strip()

    # Clean up the title - remove quotes, limit length
    title = title.strip('"\'')

    # Truncate if too long
    if len(title) > 50:
        title = title[:47] + "..."

    return title


async def run_full_council(
    user_query: str,
    council_members: List[Dict[str, Any]],
    chairman_member: Dict[str, Any]
) -> Tuple[List, List, Dict, Dict]:
    """
    Run the complete 3-stage council process.

    Args:
        user_query: The user's question
        council_members: List of council members (personas/models)
        chairman_member: The chairman persona/model

    Returns:
        Tuple of (stage1_results, stage2_results, stage3_result, metadata)
    """
    # Stage 1: Collect individual responses
    stage1_results = await stage1_collect_responses(user_query, council_members)

    # If no models responded successfully, return error
    if not stage1_results:
        return [], [], {
            "model": "error",
            "response": "All models failed to respond. Please try again."
        }, {}

    # Stage 2: Collect rankings
    stage2_results, label_to_model = await stage2_collect_rankings(user_query, stage1_results, council_members)

    # Calculate aggregate rankings
    aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)

    # Stage 3: Synthesize final answer
    stage3_result = await stage3_synthesize_final(
        user_query,
        stage1_results,
        stage2_results,
        chairman_member
    )

    # Prepare metadata
    metadata = {
        "label_to_model": label_to_model,
        "aggregate_rankings": aggregate_rankings
    }

    return stage1_results, stage2_results, stage3_result, metadata


async def generate_followup_question(
    previous_query: str,
    previous_answer: str,
    chairman_member: Dict[str, Any]
) -> str:
    """Generate a follow-up question based on the previous answer."""
    prompt = f"""You are the Chairman of an LLM Council.
    
Previous Question: {previous_query}
Previous Answer: {previous_answer}

Based on this answer, generate a single, insightful follow-up question to dig deeper into the topic or address unresolved aspects. 
The question should be directed at the remaining council members.
Do not include any preamble, just the question."""

    messages = [{"role": "user", "content": prompt}]
    
    response = await query_model(
        chairman_member['model_id'],
        messages,
        system_prompt=chairman_member.get('system_prompt')
    )
    
    if response:
        return response['content']
    return "What are your further thoughts on this?"


async def run_agentic_council(
    user_query: str,
    initial_council_members: List[Dict[str, Any]],
    chairman_member: Dict[str, Any],
    conversation_id: str
):
    """
    Run the Agentic Council process with multiple rounds and eviction.
    Yields SSE events for each message.
    """
    from . import storage
    import json
    
    current_members = list(initial_council_members)
    current_query = user_query
    round_num = 1
    max_rounds = 10

    current_members = list(initial_council_members)
    current_query = user_query
    round_num = 1
    max_rounds = 10

    while round_num <= max_rounds and len(current_members) > 0:
        try:
            # 1. Run standard council round with granular updates
            
            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(current_query, current_members)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(current_query, stage1_results, current_members)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            metadata = {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': metadata})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(current_query, stage1_results, stage2_results, chairman_member)
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Save message to storage
            storage.add_assistant_message(
                conversation_id,
                stage1_results,
                stage2_results,
                stage3_result,
                metadata
            )

            # Yield the message to the client
            message_data = {
                "role": "assistant",
                "stage1": stage1_results,
                "stage2": stage2_results,
                "stage3": stage3_result,
                "metadata": metadata,
                "round": round_num
            }
            yield f"data: {json.dumps(message_data)}\n\n"

            # Check termination conditions
            if round_num >= max_rounds or len(current_members) <= 1:
                break

            # 2. Evict lowest ranked member
            # Find member with worst average rank (highest number)
            aggregate_rankings = metadata.get("aggregate_rankings", [])
            if aggregate_rankings:
                # Sort by average_rank descending (worst first)
                sorted_rankings = sorted(aggregate_rankings, key=lambda x: x['average_rank'], reverse=True)
                worst_member_id = sorted_rankings[0]['model']
                
                # Remove from current members
                current_members = [m for m in current_members if m['model_id'] != worst_member_id]

            # 3. Generate follow-up question
            followup_query = await generate_followup_question(
                current_query,
                stage3_result['response'],
                chairman_member
            )
            
            current_query = followup_query
            
            # Add the follow-up question as a user message
            storage.add_user_message(conversation_id, f"Chairman's Follow-up: {followup_query}")
            
            # Yield the user message so UI updates
            user_msg_data = {
                "role": "user",
                "content": f"Chairman's Follow-up: {followup_query}"
            }
            yield f"data: {json.dumps(user_msg_data)}\n\n"

            round_num += 1
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            break
        storage.add_user_message(conversation_id, f"Chairman's Follow-up: {followup_query}")
        
        # Yield the user message so UI updates
        user_msg_data = {
            "role": "user",
            "content": f"Chairman's Follow-up: {followup_query}"
        }
        yield f"data: {json.dumps(user_msg_data)}\n\n"

        round_num += 1
